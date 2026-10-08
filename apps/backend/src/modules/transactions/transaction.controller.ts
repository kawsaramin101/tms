import type { Request, Response } from "express";
import * as transactionService from "./transaction.service.js";
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  totalsQuerySchema,
  updateTransactionSchema,
  updateTransactionStatusSchema,
} from "./transaction.validation.js";
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

function parseId(value: string | string[] | undefined): number {
  const id = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid transaction id");
  }
  return id;
}

export async function list(req: Request, res: Response) {
  const query = listTransactionsQuerySchema.parse(req.query);
  const result = await transactionService.listTransactions(query);
  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const result = await transactionService.getTransaction(parseId(req.params.id!));
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = createTransactionSchema.parse(req.body);
  const result = await transactionService.createTransaction(
    actor.userId,
    body,
    clientIp(req),
  );
  res.status(201).json(result);
}

export async function update(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateTransactionSchema.parse(req.body);
  const result = await transactionService.updateTransaction(
    actor.userId,
    parseId(req.params.id!),
    body,
    clientIp(req),
  );
  res.json(result);
}

export async function updateStatus(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateTransactionStatusSchema.parse(req.body);
  const result = await transactionService.updateTransactionStatus(
    actor.userId,
    parseId(req.params.id!),
    body.status,
    clientIp(req),
  );
  res.json(result);
}

export async function remove(req: Request, res: Response) {
  const actor = requireUser(req);
  const result = await transactionService.deleteTransaction(
    actor.userId,
    parseId(req.params.id!),
    clientIp(req),
  );
  res.json(result);
}

export async function totals(req: Request, res: Response) {
  const query = totalsQuerySchema.parse(req.query);
  const result = await transactionService.getTotals(query);
  res.json(result);
}

export async function accountBalance(req: Request, res: Response) {
  const result = await transactionService.getAccountBalance(
    parseId(req.params.accountId!),
  );
  res.json(result);
}
