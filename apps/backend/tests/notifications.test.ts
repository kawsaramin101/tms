import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../src/app.js";
import { toNotificationDto } from "../src/modules/notifications/notification.types.js";
import {
  getUserPreferences,
  updateUserPreferences,
} from "../src/modules/notifications/notification.service.js";

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
});

test("notifications API rejects unauthenticated requests", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`);
  assert.equal(res.status, 401);
});

test("unread-count endpoint rejects unauthenticated requests", async () => {
  const res = await fetch(`${baseUrl}/api/notifications/unread-count`);
  assert.equal(res.status, 401);
});

test("notification preferences returns default values for new user", async () => {
  const testUserId = 99999;
  const prefs = await getUserPreferences(testUserId);
  assert.equal(prefs.userId, testUserId);
  assert.equal(prefs.transactionNotifications, true);
  assert.equal(prefs.paymentReminders, true);
  assert.equal(prefs.dueDateReminders, true);
  assert.equal(prefs.lowInventoryAlerts, true);
  assert.equal(prefs.taskReminders, true);
});

test("notification preferences can toggle task notifications ON/OFF (FR-06 & FR-09)", async () => {
  const testUserId = 88888;
  const updated = await updateUserPreferences(testUserId, {
    taskReminders: false,
    paymentReminders: true,
  });
  assert.equal(updated.taskReminders, false);
  assert.equal(updated.paymentReminders, true);

  const reloaded = await getUserPreferences(testUserId);
  assert.equal(reloaded.taskReminders, false);
});

test("toNotificationDto maps fields correctly (FR-03 & FR-07)", () => {
  const now = new Date();
  const dto = toNotificationDto({
    notificationId: 123,
    userId: 45,
    title: "Upcoming Payment Due",
    message: "Membership fee is due tomorrow",
    notificationType: "PAYMENT_REMINDER",
    isRead: false,
    createdAt: now,
    readAt: null,
  });

  assert.equal(dto.notificationId, 123);
  assert.equal(dto.userId, 45);
  assert.equal(dto.title, "Upcoming Payment Due");
  assert.equal(dto.notificationType, "PAYMENT_REMINDER");
  assert.equal(dto.isRead, false);
  assert.equal(dto.readAt, null);
  assert.equal(dto.createdAt, now.toISOString());
});
