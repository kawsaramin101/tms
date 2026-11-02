import type { Request, Response } from "express";
import * as service from "./notification.service.js";
import { HttpError } from "../../middleware/error.middleware.js";
function userId(req: Request) { if (!req.user) throw new HttpError(401, "Not authenticated"); return req.user.userId; }
function idParam(value: string | string[] | undefined) { const id = Number(Array.isArray(value) ? value[0] : value); if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid notification id"); return id; }
export async function list(req: Request, res: Response) { const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20)); const unreadOnly = req.query.unreadOnly === "true"; res.json(await service.listNotifications(userId(req), page, limit, unreadOnly)); }
export async function read(req: Request, res: Response) { res.json(await service.markRead(userId(req), idParam(req.params.id))); }
export async function readAll(req: Request, res: Response) { res.json(await service.markAllRead(userId(req))); }
export async function remove(req: Request, res: Response) { res.json(await service.deleteNotification(userId(req), idParam(req.params.id))); }
export async function preferences(req: Request, res: Response) { res.json(await service.getPreferences(userId(req))); }
export async function updatePreferences(req: Request, res: Response) {
  const allowed = ["transaction", "paymentReminder", "paymentOverdue", "lowInventory", "taskReminder"] as const;
  const data: Record<string, boolean> = {};
  for (const key of allowed) if (key in req.body) { if (typeof req.body[key] !== "boolean") throw new HttpError(400, `${key} must be a boolean`); data[key] = req.body[key]; }
  res.json(await service.updatePreferences(userId(req), data));
}
