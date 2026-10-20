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
let transactionNumber: string;
let linkedTransactionId: number;
let voucherId: number;

const VOUCHER_AMOUNT = 1000;

interface PaymentDto {
  transactionId: number;
  amount: number;
  status: string;
  referenceNumber: string | null;
  creatorName: string | null;
}

interface Summary {
  voucherId: number;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: string;
  payments: PaymentDto[];
}

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
      accountName: `Voucher Payment Test Account ${Date.now()}`,
      accountType: "CASH",
      status: "ACTIVE",
      openingBalance: 10000,
    },
  });
  accountId = account.accountId;

  const txn = await prisma.transaction.create({
    data: {
      transactionNumber: `TXN-VPAY-${Date.now()}`,
      accountId,
      transactionType: "CREDIT",
      amount: 5000,
      status: "COMPLETED",
      createdBy: 1,
    },
  });
  transactionNumber = txn.transactionNumber;
  linkedTransactionId = txn.transactionId;

  const email = `voucher-payment-member-${Date.now()}@vault.local`;
  const createRes = await fetch(`${baseUrl}/api/auth/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Voucher Payment Member",
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

  const voucher = await createVoucher({
    transactionNumber,
    voucherType: "PAYMENT",
    amount: VOUCHER_AMOUNT,
    description: "Payment tracking test voucher",
  });
  voucherId = voucher.voucherId;
});

after(async () => {
  try {
    const vouchers = await prisma.voucher.findMany({
      where: { transaction: { accountId } },
      select: { voucherId: true },
    });
    const voucherIds = vouchers.map((v) => v.voucherId);
    if (voucherIds.length > 0) {
      await prisma.transaction.updateMany({
        where: { voucherId: { in: voucherIds } },
        data: { voucherId: null },
      });
      await prisma.voucher.deleteMany({
        where: { voucherId: { in: voucherIds } },
      });
    }
    await prisma.transaction.deleteMany({ where: { accountId } });
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

async function createVoucher(body: object) {
  const res = await fetch(`${baseUrl}/api/vouchers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(body),
  });
  assert.equal(res.status, 201);
  return res.json();
}

async function getSummary(id = voucherId): Promise<Summary> {
  const res = await fetch(`${baseUrl}/api/calculations/vouchers/${id}/payments`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
  return res.json();
}

async function pay(body: object, id = voucherId) {
  const res = await fetch(`${baseUrl}/api/calculations/vouchers/${id}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Summary };
}

test("new vouchers default to a zero paid amount", async () => {
  const voucher = await prisma.voucher.findUnique({ where: { voucherId } });
  assert.equal(Number(voucher?.paidAmount ?? -1), 0);

  const summary = await getSummary();
  assert.equal(summary.paidAmount, 0);
  assert.equal(summary.outstandingAmount, VOUCHER_AMOUNT);
  assert.equal(summary.paymentStatus, "Unpaid");
  assert.equal(summary.payments.length, 0);
});

test("records a voucher-linked payment on the existing transaction", async () => {
  const { status, body } = await pay({
    accountId,
    amount: VOUCHER_AMOUNT,
    referenceNumber: "PAY-REF-1",
    description: "Full settlement",
  });
  assert.equal(status, 201);
  assert.equal(body.paidAmount, VOUCHER_AMOUNT);
  assert.equal(body.outstandingAmount, 0);
  assert.equal(body.paymentStatus, "Paid");
  assert.equal(body.payments.length, 1);
  assert.equal(body.payments[0]!.transactionId, linkedTransactionId);
  assert.equal(body.payments[0]!.amount, VOUCHER_AMOUNT);
  assert.equal(body.payments[0]!.referenceNumber, "PAY-REF-1");
  assert.equal(body.payments[0]!.status, "COMPLETED");
  assert.equal(typeof body.payments[0]!.creatorName, "string");

  const stored = await prisma.transaction.findUnique({
    where: { transactionId: linkedTransactionId },
  });
  assert.ok(stored);
  assert.equal(stored.voucherId, voucherId);
  assert.equal(stored.transactionType, "PAYMENT");
  assert.equal(stored.status, "COMPLETED");

  const linkedTransactionCount = await prisma.transaction.count({
    where: { voucherId },
  });
  assert.equal(linkedTransactionCount, 1);

  const voucher = await prisma.voucher.findUnique({ where: { voucherId } });
  assert.equal(Number(voucher?.paidAmount), VOUCHER_AMOUNT);
});

test("rejects invalid and overpaying amounts", async () => {
  assert.equal((await pay({ accountId, amount: 0 })).status, 400);
  assert.equal((await pay({ accountId, amount: -50 })).status, 400);
  assert.equal((await pay({ accountId, amount: 5000, referenceNumber: "PAY-OVER" })).status, 409);

  const summary = await getSummary();
  assert.equal(summary.paidAmount, VOUCHER_AMOUNT);
  assert.equal(summary.outstandingAmount, 0);
});

test("does not create an additional transaction when the voucher is fully settled", async () => {
  const extra = await pay({
    accountId,
    amount: 10,
    referenceNumber: "PAY-REF-4",
  });
  assert.equal(extra.status, 409);

  const linkedTransactionCount = await prisma.transaction.count({
    where: { voucherId },
  });
  assert.equal(linkedTransactionCount, 1);
});

test("reverses a payment without deleting its history", async () => {
  const before = await getSummary();
  const target = before.payments[0];
  assert.ok(target);

  const res = await fetch(
    `${baseUrl}/api/calculations/vouchers/${voucherId}/payments/${target.transactionId}/reverse`,
    { method: "POST", headers: { Authorization: `Bearer ${adminToken}` } },
  );
  assert.equal(res.status, 200);
  const summary = (await res.json()) as Summary;
  assert.equal(summary.paidAmount, 0);
  assert.equal(summary.outstandingAmount, VOUCHER_AMOUNT);
  assert.equal(summary.paymentStatus, "Unpaid");
  assert.equal(summary.payments.length, before.payments.length);

  const reversed = summary.payments.find(
    (p) => p.transactionId === target.transactionId,
  );
  assert.equal(reversed?.status, "CANCELLED");

  const again = await fetch(
    `${baseUrl}/api/calculations/vouchers/${voucherId}/payments/${target.transactionId}/reverse`,
    { method: "POST", headers: { Authorization: `Bearer ${adminToken}` } },
  );
  assert.equal(again.status, 409);
});

test("ignores linked transactions that do not match the voucher direction", async () => {
  const before = await getSummary();
  await prisma.transaction.create({
    data: {
      transactionNumber: `TXN-VPAY-WRONG-${Date.now()}`,
      accountId,
      voucherId,
      transactionType: "CREDIT",
      amount: 500,
      status: "COMPLETED",
      createdBy: 1,
    },
  });
  const afterSummary = await getSummary();
  assert.equal(afterSummary.paidAmount, before.paidAmount);
  assert.equal(afterSummary.outstandingAmount, before.outstandingAmount);
});

test("handles concurrent payments without overspending", async () => {
  const concurrencyTxn = await prisma.transaction.create({
    data: {
      transactionNumber: `TXN-VPAY-CONC-${Date.now()}`,
      accountId,
      transactionType: "CREDIT",
      amount: 5000,
      status: "COMPLETED",
      createdBy: 1,
    },
  });
  const voucher = await createVoucher({
    transactionNumber: concurrencyTxn.transactionNumber,
    voucherType: "PAYMENT",
    amount: 1000,
    description: "Concurrency voucher",
  });

  const post = (reference: string) =>
    fetch(
      `${baseUrl}/api/calculations/vouchers/${voucher.voucherId}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          accountId,
          amount: 600,
          referenceNumber: reference,
        }),
      },
    );

  const results = await Promise.all([post("CONC-1"), post("CONC-2")]);
  const created = results.filter((r) => r.status === 201);
  assert.equal(created.length, 1);

  const stored = await prisma.voucher.findUnique({
    where: { voucherId: voucher.voucherId },
  });
  assert.equal(Number(stored?.paidAmount), 600);
});

test("blocks payments for cancelled and rejected vouchers", async () => {
  const voucher = await createVoucher({
    transactionNumber,
    voucherType: "PAYMENT",
    amount: 100,
  });
  await prisma.voucher.update({
    where: { voucherId: voucher.voucherId },
    data: { status: "CANCELLED" },
  });

  const payment = await pay({ accountId, amount: 50 }, voucher.voucherId);
  assert.equal(payment.status, 409);
  assert.equal((await getSummary(voucher.voucherId)).paymentStatus, "Cancelled");
});

test("requires treasurer or admin role for payment operations", async () => {
  const read = await fetch(
    `${baseUrl}/api/calculations/vouchers/${voucherId}/payments`,
    { headers: { Authorization: `Bearer ${memberToken}` } },
  );
  assert.equal(read.status, 403);

  const write = await fetch(
    `${baseUrl}/api/calculations/vouchers/${voucherId}/payments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ accountId, amount: 10 }),
    },
  );
  assert.equal(write.status, 403);
});

test("keeps account balance consistent with completed payments only", async () => {
  const res = await fetch(
    `${baseUrl}/api/transactions/accounts/${accountId}/balance`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  assert.equal(res.status, 200);
  const balance = await res.json();

  const aggregate = await prisma.transaction.aggregate({
    where: {
      accountId,
      voucherId: { not: null },
      status: "COMPLETED",
      transactionType: { in: ["PAYMENT", "DEBIT"] },
    },
    _sum: { amount: true },
  });

  assert.equal(balance.totalDebit, Number(aggregate._sum.amount ?? 0));
  assert.ok(balance.totalDebit > 0);
});
