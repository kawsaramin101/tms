import { z } from "zod";

export const NOTIFICATION_TYPES = [
  "TRANSACTION",
  "PAYMENT_REMINDER",
  "DUE_DATE_REMINDER",
  "LOW_INVENTORY",
  "TASK_REMINDER",
  "SYSTEM",
] as const;

export const createNotificationSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(1, "Title is required").max(150),
  message: z.string().trim().min(1, "Message is required"),
  notificationType: z.enum(NOTIFICATION_TYPES).optional(),
});

export const listNotificationsQuerySchema = z.object({
  isRead: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean())
    .optional(),
  notificationType: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(["date", "type", "status"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  transactionNotifications: z.boolean().optional(),
  paymentReminders: z.boolean().optional(),
  dueDateReminders: z.boolean().optional(),
  lowInventoryAlerts: z.boolean().optional(),
  taskReminders: z.boolean().optional(),
});
