import type { Request, Response } from "express";
import * as notificationService from "./notification.service.js";
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  updateNotificationPreferencesSchema,
} from "./notification.validation.js";
import { HttpError } from "../../middleware/error.middleware.js";

function parseId(value: string | string[] | undefined): number {
  const id = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid notification id");
  }
  return id;
}

export async function list(req: Request, res: Response) {
  const query = listNotificationsQuerySchema.parse(req.query);
  const result = await notificationService.listNotifications(
    req.user!.userId,
    req.user!.role,
    query,
  );
  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const result = await notificationService.getNotificationById(
    id,
    req.user!.userId,
    req.user!.role,
  );
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const body = createNotificationSchema.parse(req.body);
  const result = await notificationService.createNotification(
    body,
    req.user!.userId,
  );
  res.status(201).json(result);
}

export async function markRead(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const result = await notificationService.markAsRead(
    id,
    req.user!.userId,
    req.user!.role,
  );
  res.json(result);
}

export async function markAllRead(req: Request, res: Response) {
  const result = await notificationService.markAllAsRead(req.user!.userId);
  res.json(result);
}

export async function remove(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const result = await notificationService.deleteNotification(
    id,
    req.user!.userId,
    req.user!.role,
  );
  res.json(result);
}

export async function clearAll(req: Request, res: Response) {
  const result = await notificationService.clearAllNotifications(req.user!.userId);
  res.json(result);
}

export async function getUnreadCount(req: Request, res: Response) {
  const result = await notificationService.getUnreadCount(req.user!.userId);
  res.json(result);
}

export async function getStats(req: Request, res: Response) {
  const result = await notificationService.getStats(
    req.user!.userId,
    req.user!.role,
  );
  res.json(result);
}

export async function getPreferences(req: Request, res: Response) {
  const result = await notificationService.getUserPreferences(req.user!.userId);
  res.json(result);
}

export async function updatePreferences(req: Request, res: Response) {
  const body = updateNotificationPreferencesSchema.parse(req.body);
  const result = await notificationService.updateUserPreferences(
    req.user!.userId,
    body,
  );
  res.json(result);
}

export async function runReminders(_req: Request, res: Response) {
  const result = await notificationService.checkAndGenerateReminders();
  res.json(result);
}
