import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

let server: Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not determine test server port");
  }
  baseUrl = `http://localhost:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
});

async function login(email: string, password: string) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, body: await res.json() };
}

async function getAdminToken(): Promise<string> {
  const { body } = await login("admin@vault.local", "admin123");
  return body.token;
}

test("health check responds ok", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("valid credentials return a token and user dto", async () => {
  const { status, body } = await login("admin@vault.local", "admin123");
  assert.equal(status, 200);
  assert.ok(body.token);
  assert.equal(body.user.email, "admin@vault.local");
  assert.equal(body.user.role, "ADMIN");
  assert.equal(body.user.passwordHash, undefined);
});

test("wrong password is rejected with a generic message", async () => {
  const { status, body } = await login("admin@vault.local", "wrongpass");
  assert.equal(status, 401);
  assert.equal(body.message, "Invalid email or password");
});

test("unknown email gives the same generic message", async () => {
  const { status, body } = await login("nobody@vault.local", "x");
  assert.equal(status, 401);
  assert.equal(body.message, "Invalid email or password");
});

test("invalid payload is rejected with 400", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "" }),
  });
  assert.equal(res.status, 400);
});

test("protected route rejects requests without a token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(res.status, 401);
});

test("protected route returns the current user with a token", async () => {
  const token = await getAdminToken();
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.email, "admin@vault.local");
});

test("non-admin cannot access admin user management", async () => {
  // Create a temp non-admin user, log in, then try the admin route.
  const token = await getAdminToken();
  const email = `test-member-${Date.now()}@vault.local`;
  const createRes = await fetch(`${baseUrl}/api/auth/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Temp Member",
      email,
      password: "secret1",
      role: "MEMBER",
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();

  const { body: memberLogin } = await login(email, "secret1");
  const listRes = await fetch(`${baseUrl}/api/auth/users`, {
    headers: { Authorization: `Bearer ${memberLogin.token}` },
  });
  assert.equal(listRes.status, 403);

  // Deactivate the temp user and confirm it can no longer log in.
  await fetch(`${baseUrl}/api/auth/users/${created.userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: "INACTIVE" }),
  });
  const blocked = await login(email, "secret1");
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.message, "This account has been deactivated");

  await prisma.auditLog.deleteMany({
    where: { OR: [{ userId: created.userId }, { recordId: created.userId }] },
  });
  await prisma.auditLog.deleteMany({
    where: { OR: [{ userId: created.userId }, { recordId: created.userId }] },
  });
  await prisma.user.delete({ where: { userId: created.userId } });
});

test("change password updates the stored hash", async () => {
  const token = await getAdminToken();
  const email = `test-pw-${Date.now()}@vault.local`;
  const createRes = await fetch(`${baseUrl}/api/auth/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Temp PW",
      email,
      password: "oldpass1",
      role: "MEMBER",
    }),
  });
  const created = await createRes.json();
  const { body: memberLogin } = await login(email, "oldpass1");

  const changeRes = await fetch(`${baseUrl}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${memberLogin.token}`,
    },
    body: JSON.stringify({ currentPassword: "oldpass1", newPassword: "newpass1" }),
  });
  assert.equal(changeRes.status, 200);

  const oldLogin = await login(email, "oldpass1");
  assert.equal(oldLogin.status, 401);
  const newLogin = await login(email, "newpass1");
  assert.equal(newLogin.status, 200);

  await prisma.auditLog.deleteMany({
    where: { OR: [{ userId: created.userId }, { recordId: created.userId }] },
  });
  await prisma.user.delete({ where: { userId: created.userId } });
});
