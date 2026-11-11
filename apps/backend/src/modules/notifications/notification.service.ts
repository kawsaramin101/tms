import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/error.middleware.js";
import { toNotificationDto } from "./notification.types.js";
import type {
  CreateNotificationRequest,
  NotificationDto,
  NotificationPreferencesDto,
  NotificationQuery,
  NotificationStatsDto,
  ReminderCheckResultDto,
  UpdateNotificationPreferencesRequest,
} from "@tms/contracts";

// Resolved at call time (not import time) so NOTIFICATION_PREFS_FILE can be overridden, e.g. in tests.
// Default is relative to the backend's working directory (apps/backend), which is the same
// for `tsx` in dev and `node dist/src/server.js` in production.
function getPrefsFile(): string {
  return process.env.NOTIFICATION_PREFS_FILE
    ? path.resolve(process.env.NOTIFICATION_PREFS_FILE)
    : path.resolve(process.cwd(), "data/notification-preferences.json");
}

// In-memory cache + file storage for user notification preferences (FR-06 & FR-09)
let preferencesCache: Record<number, NotificationPreferencesDto> | null = null;

async function loadPreferences(): Promise<Record<number, NotificationPreferencesDto>> {
  if (preferencesCache) return preferencesCache;
  try {
    const raw = await fs.readFile(getPrefsFile(), "utf-8");
    preferencesCache = JSON.parse(raw);
  } catch {
    preferencesCache = {};
  }
  return preferencesCache!;
}

async function savePreferences(): Promise<void> {
  if (!preferencesCache) return;
  try {
    const file = getPrefsFile();
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(preferencesCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save notification preferences to disk:", err);
  }
}

export async function getUserPreferences(userId: number): Promise<NotificationPreferencesDto> {
  const allPrefs = await loadPreferences();
  if (allPrefs[userId]) {
    return allPrefs[userId];
  }
  const defaultPrefs: NotificationPreferencesDto = {
    userId,
    transactionNotifications: true,
    paymentReminders: true,
    dueDateReminders: true,
    lowInventoryAlerts: true,
    taskReminders: true,
    updatedAt: new Date().toISOString(),
  };
  allPrefs[userId] = defaultPrefs;
  return defaultPrefs;
}

export async function updateUserPreferences(
  userId: number,
  updates: UpdateNotificationPreferencesRequest,
): Promise<NotificationPreferencesDto> {
  const current = await getUserPreferences(userId);
  const updated: NotificationPreferencesDto = {
    userId: current.userId,
    transactionNotifications:
      updates.transactionNotifications !== undefined
        ? updates.transactionNotifications
        : current.transactionNotifications,
    paymentReminders:
      updates.paymentReminders !== undefined
        ? updates.paymentReminders
        : current.paymentReminders,
    dueDateReminders:
      updates.dueDateReminders !== undefined
        ? updates.dueDateReminders
        : current.dueDateReminders,
    lowInventoryAlerts:
      updates.lowInventoryAlerts !== undefined
        ? updates.lowInventoryAlerts
        : current.lowInventoryAlerts,
    taskReminders:
      updates.taskReminders !== undefined
        ? updates.taskReminders
        : current.taskReminders,
    updatedAt: new Date().toISOString(),
  };
  const allPrefs = await loadPreferences();
  allPrefs[userId] = updated;
  await savePreferences();
  return updated;
}

export async function listNotifications(
  actorId: number,
  role: string,
  query: NotificationQuery,
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const order = query.order ?? "desc";

  const where: any = {};

  // Regular users only see their own. Admins/Treasurers default to their own unless searching specifically
  where.userId = actorId;

  if (query.isRead !== undefined && query.isRead !== null) {
    where.isRead = query.isRead === true || query.isRead === "true";
  }

  if (query.notificationType) {
    where.notificationType = query.notificationType;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search } },
      { message: { contains: query.search } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: rows.map(toNotificationDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getNotificationById(
  id: number,
  actorId: number,
  role: string,
): Promise<NotificationDto> {
  const notification = await prisma.notification.findUnique({
    where: { notificationId: id },
  });

  if (!notification) {
    throw new HttpError(404, "Notification not found");
  }

  if (role !== "ADMIN" && role !== "TREASURER" && notification.userId !== actorId) {
    throw new HttpError(403, "Access denied to this notification");
  }

  return toNotificationDto(notification);
}

export async function createNotification(
  data: CreateNotificationRequest,
  actorId?: number,
): Promise<NotificationDto[]> {
  const targets: number[] = [];

  if (data.userId) {
    targets.push(data.userId);
  } else {
    // If no userId specified, broadcast to all active Admins and Treasurers
    const adminUsers = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { in: ["ADMIN", "TREASURER"] },
      },
      select: { userId: true },
    });
    for (const u of adminUsers) {
      targets.push(u.userId);
    }
  }

  if (targets.length === 0 && actorId) {
    targets.push(actorId);
  }

  const createdNotifications: NotificationDto[] = [];

  for (const targetUserId of targets) {
    // Check user preference for this notification type
    const prefs = await getUserPreferences(targetUserId);
    if (data.notificationType === "TRANSACTION" && !prefs.transactionNotifications) continue;
    if (data.notificationType === "PAYMENT_REMINDER" && !prefs.paymentReminders) continue;
    if (data.notificationType === "DUE_DATE_REMINDER" && !prefs.dueDateReminders) continue;
    if (data.notificationType === "LOW_INVENTORY" && !prefs.lowInventoryAlerts) continue;
    if (data.notificationType === "TASK_REMINDER" && !prefs.taskReminders) continue;

    const row = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: data.title,
        message: data.message,
        notificationType: data.notificationType ?? "SYSTEM",
        isRead: false,
      },
    });
    createdNotifications.push(toNotificationDto(row));
  }

  return createdNotifications;
}

export async function markAsRead(
  id: number,
  actorId: number,
  role: string,
): Promise<NotificationDto> {
  const existing = await prisma.notification.findUnique({
    where: { notificationId: id },
  });

  if (!existing) {
    throw new HttpError(404, "Notification not found");
  }

  if (role !== "ADMIN" && role !== "TREASURER" && existing.userId !== actorId) {
    throw new HttpError(403, "Access denied to this notification");
  }

  const updated = await prisma.notification.update({
    where: { notificationId: id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return toNotificationDto(updated);
}

export async function markAllAsRead(actorId: number): Promise<{ count: number }> {
  const res = await prisma.notification.updateMany({
    where: {
      userId: actorId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { count: res.count };
}

export async function deleteNotification(
  id: number,
  actorId: number,
  role: string,
): Promise<{ success: boolean }> {
  const existing = await prisma.notification.findUnique({
    where: { notificationId: id },
  });

  if (!existing) {
    throw new HttpError(404, "Notification not found");
  }

  if (role !== "ADMIN" && role !== "TREASURER" && existing.userId !== actorId) {
    throw new HttpError(403, "Access denied to this notification");
  }

  await prisma.notification.delete({
    where: { notificationId: id },
  });

  return { success: true };
}

export async function clearAllNotifications(actorId: number): Promise<{ deleted: number }> {
  const res = await prisma.notification.deleteMany({
    where: { userId: actorId },
  });

  return { deleted: res.count };
}

export async function getUnreadCount(actorId: number): Promise<{ unreadCount: number }> {
  const count = await prisma.notification.count({
    where: {
      userId: actorId,
      isRead: false,
    },
  });

  return { unreadCount: count };
}

export async function getStats(
  actorId: number,
  role: string,
): Promise<NotificationStatsDto> {
  const where = { userId: actorId };

  const [total, unread, read, allNotifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
    prisma.notification.count({ where: { ...where, isRead: true } }),
    prisma.notification.findMany({
      where,
      select: { notificationType: true },
    }),
  ]);

  const byType: Record<string, number> = {};
  for (const n of allNotifications) {
    const t = n.notificationType || "UNKNOWN";
    byType[t] = (byType[t] || 0) + 1;
  }

  return {
    total,
    unread,
    read,
    byType,
  };
}

/**
 * FR-02, FR-04, FR-08, FR-10: Automatic reminders check
 * Scans upcoming/overdue member fees and low-stock items.
 */
export async function checkAndGenerateReminders(): Promise<ReminderCheckResultDto> {
  const result: ReminderCheckResultDto = {
    scannedPayments: 0,
    scannedItems: 0,
    notificationsCreated: 0,
    messages: [],
  };

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // 1. Check pending member fees (FR-02 & FR-04)
  const pendingFees = await prisma.memberFee.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      dueDate: { lte: threeDaysFromNow },
    },
    include: {
      member: true,
      feeType: true,
    },
  });

  result.scannedPayments = pendingFees.length;

  for (const fee of pendingFees) {
    const isOverdue = new Date(fee.dueDate).getTime() < now.getTime();
    const type = isOverdue ? "DUE_DATE_REMINDER" : "PAYMENT_REMINDER";
    const title = isOverdue
      ? `Overdue Fee: ${fee.member.name} (${fee.feeType.feeName})`
      : `Payment Reminder: ${fee.member.name} (${fee.feeType.feeName})`;

    // Same formula as member.service.ts netAmountDue(): amountDue - discount + fine, minus what is already paid
    const netDue = Number(fee.amountDue) - Number(fee.discount) + Number(fee.fine);
    const remaining = Math.max(0, netDue - Number(fee.amountPaid));
    const formattedDue = new Date(fee.dueDate).toLocaleDateString();
    const message = `Member ${fee.member.name} (${fee.member.memberCode}) has a ${fee.feeType.feeName} fee of $${remaining.toFixed(2)} due on ${formattedDue}. Status: ${fee.status}.`;

    // Check if duplicate notification exists in last 24 hours
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const existing = await prisma.notification.findFirst({
      where: {
        title,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (!existing) {
      const created = await createNotification({
        title,
        message,
        notificationType: type,
      });
      result.notificationsCreated += created.length;
      result.messages.push(`Generated ${type} for fee #${fee.memberFeeId} (${fee.member.name})`);
    }
  }

  // 2. Check low stock inventory items (FR-10)
  const lowStockItems = await prisma.item.findMany({
    where: {
      status: "ACTIVE",
    },
  });

  for (const item of lowStockItems) {
    const qty = Number(item.quantity);
    const minQty = Number(item.minimumQuantity);

    if (minQty > 0 && qty <= minQty) {
      result.scannedItems++;
      const title = `Low Stock Alert: ${item.itemName} (${item.itemCode})`;
      const message = `Inventory item "${item.itemName}" quantity is currently ${qty} ${item.unit}, which is at or below the minimum threshold (${minQty} ${item.unit}).`;

      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const existing = await prisma.notification.findFirst({
        where: {
          title,
          createdAt: { gte: oneDayAgo },
        },
      });

      if (!existing) {
        const created = await createNotification({
          title,
          message,
          notificationType: "LOW_INVENTORY",
        });
        result.notificationsCreated += created.length;
        result.messages.push(`Generated LOW_INVENTORY for ${item.itemName}`);
      }
    }
  }

  return result;
}

/**
 * FR-01: Notify on new transaction
 */
export async function notifyTransactionCreated(
  transactionId: number,
  transactionNumber: string,
  type: string,
  amount: number,
  actorId: number,
) {
  try {
    const title = `New Transaction: ${transactionNumber}`;
    const message = `A ${type} transaction of $${amount.toFixed(2)} has been recorded in the system.`;
    await createNotification({
      title,
      message,
      notificationType: "TRANSACTION",
    }, actorId);
  } catch (err) {
    console.error("Failed to generate transaction notification:", err);
  }
}
