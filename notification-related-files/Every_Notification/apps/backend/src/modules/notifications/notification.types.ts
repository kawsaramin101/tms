import type { Notification } from "@prisma/client";
import type { NotificationDto } from "@tms/contracts";

export function toNotificationDto(row: Notification): NotificationDto {
  return {
    notificationId: row.notificationId,
    title: row.title,
    message: row.message,
    notificationType: row.notificationType,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
}
