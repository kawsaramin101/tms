import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

let server: Server;
let baseUrl: string;
let adminToken: string;
let memberToken: string;
let testUserId: number;

let memberId: number;
let feeTypeId: number;
let memberFeeId: number;
let createdMemberCode: string;

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
    body: JSON.stringify({
      email: "admin@vault.local",
      password: "admin123",
    }),
  });

  assert.equal(loginRes.status, 200);
  adminToken = (await loginRes.json()).token;
  const email = `mf-member-${Date.now()}@vault.local`;

  const createUserRes = await fetch(`${baseUrl}/api/auth/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: "Fee Test Member",
      email,
      password: "secret1",
      role: "MEMBER",
    }),
  });

  assert.equal(createUserRes.status, 201);
  testUserId = (await createUserRes.json()).userId;

  const memberLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "secret1" }),
  });

  assert.equal(memberLoginRes.status, 200);
  memberToken = (await memberLoginRes.json()).token;
});

after(async () => {
  if (memberFeeId) {
    await prisma.feePayment.deleteMany({ where: { memberFeeId } });
    await prisma.memberFee.deleteMany({ where: { memberFeeId } });
  }

  if (feeTypeId) {
    await prisma.feeType.deleteMany({ where: { feeTypeId } });
  }

  if (memberId) {
    await prisma.member.deleteMany({ where: { memberId } });
  }
  if (testUserId) {
  await prisma.auditLog.deleteMany({
    where: { OR: [{ userId: testUserId }, { recordId: testUserId }] },
  });
  await prisma.user.deleteMany({ where: { userId: testUserId } });
}
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
});

async function api(
  path: string,
  method = "GET",
  body?: object,
  token = adminToken,
) {
  const res = await fetch(`${baseUrl}/api/members-fees${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  return {
    status: res.status,
    body: text ? JSON.parse(text) : null,
  };
}

test("member-fees API rejects unauthenticated requests", async () => {
  const res = await fetch(`${baseUrl}/api/members-fees/members`);
  assert.equal(res.status, 401);
});
test("regular member cannot create a member record", async () => {
  const result = await api(
    "/members",
    "POST",
    {
      memberCode: `FORBIDDEN-${Date.now()}`,
      name: "Unauthorized Member",
      memberType: "STUDENT",
      status: "ACTIVE",
    },
    memberToken,
  );

  assert.equal(result.status, 403);
});

test("admin can create a member, fee type, fee and record a valid payment", async () => {
  createdMemberCode = `MF-${Date.now()}`;

  const member = await api("/members", "POST", {
    memberCode: createdMemberCode,
    name: "Member Fee Test",
    memberType: "STUDENT",
    department: "CSE",
    status: "ACTIVE",
  });

  assert.equal(member.status, 201);
  assert.ok(member.body.memberId);
  memberId = member.body.memberId;

  const feeType = await api("/fee-types", "POST", {
    feeName: `Test Fee ${Date.now()}`,
    defaultAmount: 1000,
    description: "Automated test fee",
    status: "ACTIVE",
  });

  assert.equal(feeType.status, 201);
  assert.ok(feeType.body.feeTypeId);
  feeTypeId = feeType.body.feeTypeId;

  const fee = await api("/member-fees", "POST", {
    memberId,
    feeTypeId,
    amountDue: 1000,
    discount: 100,
    fine: 0,
    dueDate: "2027-12-31",
    status: "PENDING",
  });

  assert.equal(fee.status, 201);
  assert.ok(fee.body.memberFeeId);
  memberFeeId = fee.body.memberFeeId;
  assert.equal(fee.body.amountDue, 1000);

  const payment = await api("/fee-payments", "POST", {
    memberFeeId,
    receiptNumber: `R-${Date.now()}`,
    amount: 400,
    paymentMethod: "CASH",
    remarks: "Test partial payment",
  });

  assert.equal(payment.status, 201);
  assert.equal(payment.body.amount, 400);

  const updatedFee = await api(`/member-fees/${memberFeeId}`);
  assert.equal(updatedFee.status, 200);
  assert.equal(updatedFee.body.amountPaid, 400);
  assert.equal(updatedFee.body.status, "PARTIAL");
});

test("invalid member payload is rejected", async () => {
  const result = await api("/members", "POST", {
    memberCode: "   ",
    name: "",
    memberType: "STUDENT",
    status: "ACTIVE",
  });

  assert.equal(result.status, 400);
});

test("payment greater than outstanding balance is rejected", async () => {
  assert.ok(memberFeeId, "Fee should have been created by the previous test");

  const result = await api("/fee-payments", "POST", {
    memberFeeId,
    receiptNumber: `OVER-${Date.now()}`,
    amount: 901,
    paymentMethod: "CASH",
  });

  assert.equal(result.status, 400);
});

test("duplicate member code is rejected", async () => {
  assert.ok(createdMemberCode);

  const result = await api("/members", "POST", {
    memberCode: createdMemberCode,
    name: "Duplicate Member",
    memberType: "STUDENT",
    status: "ACTIVE",
  });

  assert.ok(
    result.status === 400 || result.status === 409,
    `Expected 400 or 409, received ${result.status}`,
  );
});
test("cancelled fee cannot receive a payment", async () => {
  const cancelledFee = await api("/member-fees", "POST", {
    memberId,
    feeTypeId,
    amountDue: 500,
    discount: 0,
    fine: 0,
    dueDate: "2027-12-31",
    status: "CANCELLED",
  });

  assert.equal(cancelledFee.status, 201);

  const result = await api("/fee-payments", "POST", {
    memberFeeId: cancelledFee.body.memberFeeId,
    receiptNumber: `CANCEL-${Date.now()}`,
    amount: 100,
    paymentMethod: "CASH",
  });

  assert.equal(result.status, 409);

  await prisma.memberFee.deleteMany({
    where: { memberFeeId: cancelledFee.body.memberFeeId },
  });
});
