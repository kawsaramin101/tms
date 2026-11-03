import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/error.middleware.js";
import { toNotificationDto } from "./notification.types.js";
import type { NotificationPreferencesDto } from "@tms/contracts";

const DEFAULT_PREFERENCES: NotificationPreferencesDto = {
  transaction: true, paymentReminder: true, paymentOverdue: true,
  lowInventory: true, taskReminder: true,
};

export async function listNotifications(userId: number, page = 1, limit = 20, unreadOnly = false) {
  const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };
  const [total, rows, unreadCount] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { data: rows.map(toNotificationDto), unreadCount, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function markRead(userId: number, id: number) {
  const row = await prisma.notification.findFirst({ where: { notificationId: id, userId } });
  if (!row) throw new HttpError(404, "Notification not found");
  return toNotificationDto(await prisma.notification.update({ where: { notificationId: id }, data: { isRead: true, readAt: new Date() } }));
}

export async function markAllRead(userId: number) {
  const result = await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
  return { updated: result.count };
}

export async function deleteNotification(userId: number, id: number) {
  const result = await prisma.notification.deleteMany({ where: { notificationId: id, userId } });
  if (!result.count) throw new HttpError(404, "Notification not found");
  return { message: "Notification deleted" };
}

export async function getPreferences(userId: number): Promise<NotificationPreferencesDto> {
  const p = await prisma.notificationPreference.findUnique({ where: { userId } });
  return p ? { transaction: p.transaction, paymentReminder: p.paymentReminder, paymentOverdue: p.paymentOverdue, lowInventory: p.lowInventory, taskReminder: p.taskReminder } : DEFAULT_PREFERENCES;
}

export async function updatePreferences(userId: number, data: Partial<NotificationPreferencesDto>) {
  const p = await prisma.notificationPreference.upsert({ where: { userId }, create: { userId, ...DEFAULT_PREFERENCES, ...data }, update: data });
  return { transaction: p.transaction, paymentReminder: p.paymentReminder, paymentOverdue: p.paymentOverdue, lowInventory: p.lowInventory, taskReminder: p.taskReminder };
}

export async function createForUser(userId: number, title: string, message: string, type: string, dedupeKey?: string) {
  const prefs = await getPreferences(userId);
  const enabled = type === "TRANSACTION" ? prefs.transaction : type === "PAYMENT_REMINDER" ? prefs.paymentReminder : type === "PAYMENT_OVERDUE" ? prefs.paymentOverdue : type === "LOW_INVENTORY" ? prefs.lowInventory : type === "TASK_REMINDER" ? prefs.taskReminder : true;
  if (!enabled) return null;
  try {
    return await prisma.notification.create({ data: { userId, title, message, notificationType: type, dedupeKey: dedupeKey ?? null } });
  } catch (error) {
    if (dedupeKey && (error as { code?: string }).code === "P2002") return null;
    throw error;
  }
}

export async function notifyAll(title: string, message: string, type: string, dedupeKey: string) {
  const users = await prisma.user.findMany({ where: { status: "ACTIVE" }, select: { userId: true } });
  await Promise.all(users.map((u) => createForUser(u.userId, title, message, type, `${dedupeKey}:u${u.userId}`)));
}

// Daily reminder scan for existing financial and inventory records.
export async function runReminderScan() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate() + 2);
  const fees = await prisma.memberFee.findMany({ where: { status: { notIn: ["PAID", "CANCELLED"] } }, include: { member: true, feeType: true } });
  for (const fee of fees) {
    const due = new Date(fee.dueDate); due.setHours(0, 0, 0, 0);
    const overdue = due < today;
    const dueSoon = due >= today && due < dayAfter;
    if (!overdue && !dueSoon) continue;
    const type = overdue ? "PAYMENT_OVERDUE" : "PAYMENT_REMINDER";
    const dueLabel = due.toLocaleDateString("en-GB");
    const title = overdue ? "Payment overdue" : "Payment due soon";
    const message = `${fee.feeType.feeName} for ${fee.member.name} is ${overdue ? "overdue" : "due on " + dueLabel}. Outstanding amount: ${(Number(fee.amountDue) - Number(fee.amountPaid)).toFixed(2)}.`;
    await notifyAll(title, message, type, `fee-${fee.memberFeeId}-${type}-${dueLabel}`);
  }
  const items = await prisma.item.findMany({ where: { status: "ACTIVE" } });
  for (const item of items) {
    if (Number(item.quantity) < Number(item.minimumQuantity)) {
      await notifyAll("Low inventory", `${item.itemName} is below its minimum stock level. Current: ${item.quantity}; minimum: ${item.minimumQuantity}.`, "LOW_INVENTORY", `low-stock-${item.itemId}-${String(item.quantity)}`);
    }
  }
}
