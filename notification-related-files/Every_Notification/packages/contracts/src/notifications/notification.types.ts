export const NOTIFICATION_TYPES = [
  "TRANSACTION", "PAYMENT_REMINDER", "PAYMENT_OVERDUE", "LOW_INVENTORY", "TASK_REMINDER", "SYSTEM",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationDto {
  notificationId: number;
  title: string;
  message: string;
  notificationType: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}
export interface NotificationListResponse {
  data: NotificationDto[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface NotificationPreferencesDto {
  transaction: boolean;
  paymentReminder: boolean;
  paymentOverdue: boolean;
  lowInventory: boolean;
  taskReminder: boolean;
}
