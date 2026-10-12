import type { Request, Response } from "express";
import * as memberService from "./member.service.js";
import {
  createMemberSchema,
  updateMemberSchema,
  updateMemberStatusSchema,
  memberSearchSchema,
  createFeeTypeSchema,
  updateFeeTypeSchema,
  updateFeeTypeStatusSchema,
  createMemberFeeSchema,
  updateMemberFeeSchema,
  updateMemberFeeStatusSchema,
  createFeePaymentSchema,
} from "./member.validation.js";
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
    throw new HttpError(400, "Invalid id");
  }
  return id;
}

export async function listMembers(_req: Request, res: Response) {
  res.json(await memberService.listMembers());
}

export async function getMember(req: Request, res: Response) {
  res.json(await memberService.getMember(parseId(req.params.id)));
}

export async function createMember(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = createMemberSchema.parse(req.body);
  res.status(201).json(await memberService.createMember(actor.userId, body, clientIp(req)));
}

export async function updateMember(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateMemberSchema.parse(req.body);
  res.json(await memberService.updateMember(actor.userId, parseId(req.params.id), body, clientIp(req)));
}

export async function updateMemberStatus(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateMemberStatusSchema.parse(req.body);
  res.json(await memberService.updateMemberStatus(actor.userId, parseId(req.params.id), body.status, clientIp(req)));
}

export async function searchMembers(req: Request, res: Response) {
  const query = memberSearchSchema.parse(req.query);
  res.json(await memberService.searchMembers(query));
}

export async function listFeeTypes(_req: Request, res: Response) {
  res.json(await memberService.listFeeTypes());
}

export async function getFeeType(req: Request, res: Response) {
  res.json(await memberService.getFeeType(parseId(req.params.id)));
}

export async function createFeeType(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = createFeeTypeSchema.parse(req.body);
  res.status(201).json(await memberService.createFeeType(actor.userId, body, clientIp(req)));
}

export async function updateFeeType(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateFeeTypeSchema.parse(req.body);
  res.json(await memberService.updateFeeType(actor.userId, parseId(req.params.id), body, clientIp(req)));
}

export async function updateFeeTypeStatus(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateFeeTypeStatusSchema.parse(req.body);
  res.json(await memberService.updateFeeTypeStatus(actor.userId, parseId(req.params.id), body.status, clientIp(req)));
}

export async function listMemberFees(_req: Request, res: Response) {
  res.json(await memberService.listMemberFees());
}

export async function getMemberFee(req: Request, res: Response) {
  res.json(await memberService.getMemberFee(parseId(req.params.id)));
}

export async function createMemberFee(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = createMemberFeeSchema.parse(req.body);
  res.status(201).json(await memberService.createMemberFee(actor.userId, body, clientIp(req)));
}

export async function updateMemberFee(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateMemberFeeSchema.parse(req.body);
  res.json(await memberService.updateMemberFee(actor.userId, parseId(req.params.id), body, clientIp(req)));
}

export async function updateMemberFeeStatus(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateMemberFeeStatusSchema.parse(req.body);
  res.json(await memberService.updateMemberFeeStatus(actor.userId, parseId(req.params.id), body.status, clientIp(req)));
}

export async function listFeePayments(_req: Request, res: Response) {
  res.json(await memberService.listFeePayments());
}

export async function getFeePayment(req: Request, res: Response) {
  res.json(await memberService.getFeePayment(parseId(req.params.id)));
}

export async function createFeePayment(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = createFeePaymentSchema.parse(req.body);
  res.status(201).json(await memberService.createFeePayment(actor.userId, body, clientIp(req)));
}
