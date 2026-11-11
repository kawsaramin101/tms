export type NotificationType =
  | "TRANSACTION"
  | "PAYMENT_REMINDER"
  | "DUE_DATE_REMINDER"
  | "LOW_INVENTORY"
  | "TASK_REMINDER"
  | "SYSTEM";

export interface NotificationDto {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  notificationType: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface CreateNotificationRequest {
  userId?: number | undefined;
  title: string;
  message: string;
  notificationType?: NotificationType | string | undefined;
}

export interface NotificationQuery {
  isRead?: boolean | string | undefined;
  notificationType?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: "date" | "type" | "status" | undefined;
  order?: "asc" | "desc" | undefined;
}

export interface NotificationStatsDto {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
}

export interface NotificationPreferencesDto {
  userId: number;
  transactionNotifications: boolean;
  paymentReminders: boolean;
  dueDateReminders: boolean;
  lowInventoryAlerts: boolean;
  taskReminders: boolean;
  updatedAt: string;
}

export interface UpdateNotificationPreferencesRequest {
  transactionNotifications?: boolean | undefined;
  paymentReminders?: boolean | undefined;
  dueDateReminders?: boolean | undefined;
  lowInventoryAlerts?: boolean | undefined;
  taskReminders?: boolean | undefined;
}

export interface ReminderCheckResultDto {
  scannedPayments: number;
  scannedItems: number;
  notificationsCreated: number;
  messages: string[];
}
