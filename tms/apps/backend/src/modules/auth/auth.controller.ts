import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import {
  changePasswordSchema,
  createUserSchema,
  loginSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "./auth.validation.js";
import { HttpError } from "../../middleware/error.middleware.js";

function clientIp(req: Request): string | undefined {
  return req.ip ?? req.socket.remoteAddress ?? undefined;
}

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return req.user;
}

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid user id");
  }
  return id;
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body.email, body.password, clientIp(req));
  res.json(result);
}

export async function logout(req: Request, res: Response) {
  const user = requireUser(req);
  const result = await authService.logout(user.userId, clientIp(req));
  res.json(result);
}

export async function me(req: Request, res: Response) {
  const user = requireUser(req);
  const result = await authService.getMe(user.userId);
  res.json(result);
}

export async function listUsers(_req: Request, res: Response) {
  const result = await authService.listUsers();
  res.json(result);
}

export async function createUser(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = createUserSchema.parse(req.body);
  const result = await authService.createUser(actor.userId, body, clientIp(req));
  res.status(201).json(result);
}

export async function updateUser(req: Request, res: Response) {
  const actor = requireUser(req);
  const id = parseId(req.params.id as string);
  const body = updateUserSchema.parse(req.body);
  const result = await authService.updateUser(actor.userId, id, body, clientIp(req));
  res.json(result);
}

export async function updateUserStatus(req: Request, res: Response) {
  const actor = requireUser(req);
  const id = parseId(req.params.id as string);
  const body = updateUserStatusSchema.parse(req.body);
  const result = await authService.updateUserStatus(actor.userId, id, body, clientIp(req));
  res.json(result);
}

export async function changePassword(req: Request, res: Response) {
  const user = requireUser(req);
  const body = changePasswordSchema.parse(req.body);
  const result = await authService.changePassword(user.userId, body, clientIp(req));
  res.json(result);
}
