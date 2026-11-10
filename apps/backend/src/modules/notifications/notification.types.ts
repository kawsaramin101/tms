import type { NotificationDto } from "@tms/contracts";
import type { Notification } from "@prisma/client";

export function toNotificationDto(n: Notification): NotificationDto {
  return {
    notificationId: n.notificationId,
    userId: n.userId,
    title: n.title,
    message: n.message,
    notificationType: n.notificationType,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
  };
}
