import type { Request, Response } from "express";
import * as calculationService from "./calculation.service.js";
import {
  createVoucherPaymentSchema,
  listAuditLogsQuerySchema,
} from "./calculation.validation.js";
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

function parseId(
  value: string | string[] | undefined,
  label: string,
): number {
  const id = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `Invalid ${label}`);
  }
  return id;
}

export async function listAuditLogs(req: Request, res: Response) {
  const query = listAuditLogsQuerySchema.parse(req.query);
  const result = await calculationService.listAuditLogs(query);
  res.json(result);
}

export async function listVoucherPaymentTotals(_req: Request, res: Response) {
  const result = await calculationService.listVoucherPaymentTotals();
  res.json(result);
}

export async function getVoucherPayments(req: Request, res: Response) {
  const voucherId = parseId(req.params.voucherId, "voucher id");
  const result = await calculationService.getVoucherPaymentSummary(voucherId);
  res.json(result);
}

export async function createVoucherPayment(req: Request, res: Response) {
  const actor = requireUser(req);
  const voucherId = parseId(req.params.voucherId, "voucher id");
  const body = createVoucherPaymentSchema.parse(req.body);
  const result = await calculationService.recordVoucherPayment(
    actor.userId,
    voucherId,
    body,
    clientIp(req),
  );
  res.status(201).json(result);
}

export async function reverseVoucherPayment(req: Request, res: Response) {
  const actor = requireUser(req);
  const voucherId = parseId(req.params.voucherId, "voucher id");
  const transactionId = parseId(req.params.transactionId, "transaction id");
  const result = await calculationService.reverseVoucherPayment(
    actor.userId,
    voucherId,
    transactionId,
    clientIp(req),
  );
  res.json(result);
}
