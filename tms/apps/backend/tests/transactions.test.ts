import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

let server: Server;
let baseUrl: string;
let adminToken: string;
let accountId: number;
let memberToken: string;
let memberId: number;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not determine test server port");
  }
  baseUrl = `http://localhost:${address.port}`;

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@vault.local", password: "admin123" }),
  });
  adminToken = (await loginRes.json()).token;

  const account = await prisma.account.create({
    data: {
      accountName: `Test Account ${Date.now()}`,
      accountType: "CASH",
      status: "ACTIVE",
      openingBalance: 1000,
    },
  });
  accountId = account.accountId;

  // A non-admin member user for permission tests.
  const email = `txn-member-${Date.now()}@vault.local`;
  const createRes = await fetch(`${baseUrl}/api/auth/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Txn Member",
      email,
      password: "secret1",
      role: "MEMBER",
    }),
  });
  memberId = (await createRes.json()).userId;
  const memberLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "secret1" }),
  });
  memberToken = (await memberLogin.json()).token;
});

after(async () => {
  await prisma.transaction.deleteMany({ where: { accountId } });
  await prisma.auditLog.deleteMany({ where: { tableName: "transactions" } });
  await prisma.account.deleteMany({ where: { accountId } });
  await prisma.auditLog.deleteMany({
    where: { OR: [{ userId: memberId }, { recordId: memberId }] },
  });
  await prisma.user.deleteMany({ where: { userId: memberId } });
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
});

async function createTransaction(body: object, token = adminToken) {
  const res = await fetch(`${baseUrl}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("unauthenticated requests are rejected", async () => {
  const res = await fetch(`${baseUrl}/api/transactions`);
  assert.equal(res.status, 401);
});

test("create transaction validates the payload", async () => {
  const { status } = await createTransaction({ accountId, amount: -5 });
  assert.equal(status, 400);
});

test("member cannot create a transaction", async () => {
  const { status } = await createTransaction(
    {
      accountId,
      transactionType: "CREDIT",
      amount: 100,
    },
    memberToken,
  );
  assert.equal(status, 403);
});

test("admin can create, read, update, and delete a transaction", async () => {
  // Create
  const created = await createTransaction({
    accountId,
    transactionType: "CREDIT",
    amount: 500,
    category: "Donation",
    description: "Test credit",
  });
  assert.equal(created.status, 201);
  assert.ok(created.body.transactionId);
  assert.equal(created.body.amount, 500);
  assert.equal(created.body.status, "COMPLETED");
  const id = created.body.transactionId;

  // Read
  const getRes = await fetch(`${baseUrl}/api/transactions/${id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(getRes.status, 200);
  assert.equal((await getRes.json()).transactionId, id);

  // Update
  const patchRes = await fetch(`${baseUrl}/api/transactions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ amount: 750, description: "Updated" }),
  });
  assert.equal(patchRes.status, 200);
  assert.equal((await patchRes.json()).amount, 750);

  // Status update
  const statusRes = await fetch(`${baseUrl}/api/transactions/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: "PENDING" }),
  });
  assert.equal(statusRes.status, 200);
  assert.equal((await statusRes.json()).status, "PENDING");

  // Delete
  const delRes = await fetch(`${baseUrl}/api/transactions/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(delRes.status, 200);
  const getAfter = await fetch(`${baseUrl}/api/transactions/${id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(getAfter.status, 404);
});

test("list supports search, type filter, and pagination", async () => {
  await createTransaction({
    accountId,
    transactionType: "PAYMENT",
    amount: 200,
    category: "Rent",
  });
  await createTransaction({
    accountId,
    transactionType: "RECEIPT",
    amount: 300,
    category: "Dues",
  });

  const all = await fetch(`${baseUrl}/api/transactions?accountId=${accountId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const allBody = await all.json();
  assert.equal(allBody.pagination.total, 2);

  const filtered = await fetch(
    `${baseUrl}/api/transactions?accountId=${accountId}&type=PAYMENT`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  const filteredBody = await filtered.json();
  assert.equal(filteredBody.pagination.total, 1);
  assert.equal(filteredBody.data[0].transactionType, "PAYMENT");

  const searched = await fetch(
    `${baseUrl}/api/transactions?accountId=${accountId}&search=Dues`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  assert.equal((await searched.json()).pagination.total, 1);
});

test("totals groups completed transactions by type and account", async () => {
  const res = await fetch(
    `${baseUrl}/api/transactions/totals?accountId=${accountId}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.count, 2);
  assert.equal(body.totalAmount, 500);
  assert.equal(body.byType.length, 2);
  assert.equal(body.byAccount[0].accountId, accountId);
});

test("account balance reflects opening balance plus credits minus debits", async () => {
  const res = await fetch(
    `${baseUrl}/api/transactions/accounts/${accountId}/balance`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.openingBalance, 1000);
  assert.equal(body.totalCredit, 300);
  assert.equal(body.totalDebit, 200);
  assert.equal(body.runningBalance, 1100);
});

test("invalid transaction id is rejected with 400", async () => {
  const res = await fetch(`${baseUrl}/api/transactions/abc`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 400);
});
