import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

let server: Server;
let baseUrl: string;
let adminToken: string;
let memberToken: string;
let memberId: number;
let accountId: number;
let transactionId: number;
let transactionNumber: string;

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

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
      accountName: `Voucher Test Account ${Date.now()}`,
      accountType: "CASH",
      status: "ACTIVE",
      openingBalance: 1000,
    },
  });
  accountId = account.accountId;

  const txn = await prisma.transaction.create({
    data: {
      transactionNumber: `TXN-VTEST-${Date.now()}`,
      accountId,
      transactionType: "CREDIT",
      amount: 5000,
      status: "COMPLETED",
      createdBy: 1,
    },
  });
  transactionId = txn.transactionId;
  transactionNumber = txn.transactionNumber;

  const email = `voucher-member-${Date.now()}@vault.local`;
  const createRes = await fetch(`${baseUrl}/api/auth/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Voucher Member",
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
  try {
    const txns = await prisma.transaction.findMany({
      where: { accountId },
      select: { transactionId: true },
    });
    const txnIds = txns.map((t) => t.transactionId);
    if (txnIds.length > 0) {
      const vouchers = await prisma.voucher.findMany({
        where: { transactionId: { in: txnIds } },
        select: { voucherId: true },
      });
      const voucherIds = vouchers.map((v) => v.voucherId);
      if (voucherIds.length > 0) {
        await prisma.voucherPhoto.deleteMany({
          where: { voucherId: { in: voucherIds } },
        });
        await prisma.voucher.deleteMany({
          where: { voucherId: { in: voucherIds } },
        });
      }
      await prisma.transaction.deleteMany({
        where: { transactionId: { in: txnIds } },
      });
    }
    await prisma.auditLog.deleteMany({ where: { tableName: "vouchers" } });
    await prisma.account.deleteMany({ where: { accountId } });
    await prisma.auditLog.deleteMany({
      where: { OR: [{ userId: memberId }, { recordId: memberId }] },
    });
    await prisma.user.deleteMany({ where: { userId: memberId } });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
});

async function createVoucher(body: object, token = adminToken) {
  const res = await fetch(`${baseUrl}/api/vouchers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("requires authentication for voucher list", async () => {
  const res = await fetch(`${baseUrl}/api/vouchers`);
  assert.equal(res.status, 401);
});

test("creates a voucher linked to a transaction", async () => {
  const { status, body } = await createVoucher({
    transactionNumber,
    voucherType: "PAYMENT",
    amount: 2500,
    description: "Test voucher",
  });
  assert.equal(status, 201);
  assert.equal(body.transactionId, transactionId);
  assert.equal(body.transactionNumber, transactionNumber);
  assert.equal(body.voucherType, "PAYMENT");
  assert.equal(body.amount, 2500);
  assert.equal(body.status, "PENDING");
  assert.equal(body.photoCount, 0);
});

test("rejects invalid voucher type", async () => {
  const { status } = await createVoucher({
    transactionNumber,
    voucherType: "NOPE",
    amount: 10,
  });
  assert.equal(status, 400);
});

test("rejects unknown transaction number", async () => {
  const { status } = await createVoucher({
    transactionNumber: "TXN-DOES-NOT-EXIST",
    voucherType: "PAYMENT",
    amount: 10,
  });
  assert.equal(status, 404);
});

test("member cannot create vouchers", async () => {
  const { status } = await createVoucher(
    { transactionNumber, voucherType: "PAYMENT", amount: 10 },
    memberToken,
  );
  assert.equal(status, 403);
});

test("member can view vouchers", async () => {
  const res = await fetch(`${baseUrl}/api/vouchers`, {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert.equal(res.status, 200);
});

test("uploads, views, replaces, and deletes photos", async () => {
  const { body: voucher } = await createVoucher({
    transactionNumber,
    voucherType: "RECEIPT",
    amount: 100,
  });

  const form = new FormData();
  form.append("photos", new Blob([PNG], { type: "image/png" }), "a.png");
  form.append("photos", new Blob([PNG], { type: "image/png" }), "b.png");
  const uploadRes = await fetch(`${baseUrl}/api/vouchers/${voucher.voucherId}/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: form,
  });
  assert.equal(uploadRes.status, 201);
  const photos = (await uploadRes.json()) as Array<{ photoId: number }>;
  assert.equal(photos.length, 2);

  const viewRes = await fetch(
    `${baseUrl}/api/vouchers/${voucher.voucherId}/photos/${photos[0]!.photoId}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  assert.equal(viewRes.status, 200);

  const replaceForm = new FormData();
  replaceForm.append("photo", new Blob([PNG], { type: "image/png" }), "c.png");
  const replaceRes = await fetch(
    `${baseUrl}/api/vouchers/${voucher.voucherId}/photos/${photos[0]!.photoId}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: replaceForm,
    },
  );
  assert.equal(replaceRes.status, 200);

  const deleteRes = await fetch(
    `${baseUrl}/api/vouchers/${voucher.voucherId}/photos/${photos[1]!.photoId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert.equal(deleteRes.status, 200);

  const getRes = await fetch(`${baseUrl}/api/vouchers/${voucher.voucherId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const updated = await getRes.json();
  assert.equal(updated.photoCount, 1);
});

test("rejects non-image uploads", async () => {
  const { body: voucher } = await createVoucher({
    transactionNumber,
    voucherType: "PAYMENT",
    amount: 50,
  });
  const form = new FormData();
  form.append("photos", new Blob(["hello"], { type: "text/plain" }), "x.txt");
  const res = await fetch(`${baseUrl}/api/vouchers/${voucher.voucherId}/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: form,
  });
  assert.equal(res.status, 400);
});

test("member cannot upload photos", async () => {
  const { body: voucher } = await createVoucher({
    transactionNumber,
    voucherType: "PAYMENT",
    amount: 60,
  });
  const form = new FormData();
  form.append("photos", new Blob([PNG], { type: "image/png" }), "m.png");
  const res = await fetch(`${baseUrl}/api/vouchers/${voucher.voucherId}/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${memberToken}` },
    body: form,
  });
  assert.equal(res.status, 403);
});

test("links a voucher to another transaction", async () => {
  const { body: voucher } = await createVoucher({
    transactionNumber,
    voucherType: "JOURNAL",
    amount: 75,
  });
  const txn2 = await prisma.transaction.create({
    data: {
      transactionNumber: `TXN-VLINK-${Date.now()}`,
      accountId,
      transactionType: "DEBIT",
      amount: 75,
      status: "COMPLETED",
      createdBy: 1,
    },
  });
  const res = await fetch(`${baseUrl}/api/vouchers/${voucher.voucherId}/link`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ transactionNumber: txn2.transactionNumber }),
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).transactionNumber, txn2.transactionNumber);
});
