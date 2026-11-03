import type { Request, Response } from "express";
import * as accountService from "./account.service.js";
import {
  createAccountSchema,
  updateAccountSchema,
} from "./account.validation.js";
import { HttpError } from "../../middleware/error.middleware.js";

function parseId(value: string | string[] | undefined): number {
  const id = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid account id");
  }
  return id;
}

export async function list(_req: Request, res: Response) {
  res.json(await accountService.listAccounts());
}

export async function getById(req: Request, res: Response) {
  res.json(await accountService.getAccount(parseId(req.params.id)));
}

export async function create(req: Request, res: Response) {
  const body = createAccountSchema.parse(req.body);
  res.status(201).json(await accountService.createAccount(body));
}

export async function update(req: Request, res: Response) {
  const body = updateAccountSchema.parse(req.body);
  res.json(await accountService.updateAccount(parseId(req.params.id), body));
}

export async function remove(req: Request, res: Response) {
  res.json(await accountService.deleteAccount(parseId(req.params.id)));
}
