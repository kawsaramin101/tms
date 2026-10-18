import type { Request, Response } from "express";
import * as voucherService from "./voucher.service.js";
import type { StoredPhoto } from "./voucher.service.js";
import {
  createVoucherSchema,
  linkTransactionSchema,
  listVouchersQuerySchema,
  updateVoucherSchema,
  updateVoucherStatusSchema,
} from "./voucher.validation.js";
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

function parseId(value: string | string[] | undefined, label: string): number {
  const id = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `Invalid ${label}`);
  }
  return id;
}

function toStoredPhotos(req: Request): StoredPhoto[] {
  const files = (req.files ?? []) as Express.Multer.File[];
  const single = (req as Request & { file?: Express.Multer.File }).file;
  const all = single ? [...files, single] : files;
  return all.map((f) => ({
    fileName: f.originalname,
    storedName: f.filename,
    storedPath: f.path,
    mimeType: f.mimetype,
    fileSize: f.size,
  }));
}

export async function list(req: Request, res: Response) {
  const query = listVouchersQuerySchema.parse(req.query);
  const result = await voucherService.listVouchers(query);
  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const result = await voucherService.getVoucher(
    parseId(req.params.id, "voucher id"),
  );
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = createVoucherSchema.parse(req.body);
  const result = await voucherService.createVoucher(
    actor.userId,
    body,
    clientIp(req),
  );
  res.status(201).json(result);
}

export async function update(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateVoucherSchema.parse(req.body);
  const result = await voucherService.updateVoucher(
    actor.userId,
    parseId(req.params.id, "voucher id"),
    body,
    clientIp(req),
  );
  res.json(result);
}

export async function updateStatus(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = updateVoucherStatusSchema.parse(req.body);
  const result = await voucherService.updateVoucherStatus(
    actor.userId,
    parseId(req.params.id, "voucher id"),
    body.status,
    clientIp(req),
  );
  res.json(result);
}

export async function link(req: Request, res: Response) {
  const actor = requireUser(req);
  const body = linkTransactionSchema.parse(req.body);
  const result = await voucherService.linkTransaction(
    actor.userId,
    parseId(req.params.id, "voucher id"),
    body.transactionNumber,
    clientIp(req),
  );
  res.json(result);
}

export async function remove(req: Request, res: Response) {
  const actor = requireUser(req);
  const result = await voucherService.deleteVoucher(
    actor.userId,
    parseId(req.params.id, "voucher id"),
    clientIp(req),
  );
  res.json(result);
}

export async function uploadPhotos(req: Request, res: Response) {
  const actor = requireUser(req);
  const voucherId = parseId(req.params.id, "voucher id");
  const photos = toStoredPhotos(req);
  if (photos.length === 0) {
    throw new HttpError(400, "At least one photo must be uploaded");
  }
  const result = await voucherService.addPhotos(
    actor.userId,
    voucherId,
    photos,
    clientIp(req),
  );
  res.status(201).json(result);
}

export async function viewPhoto(req: Request, res: Response) {
  const photo = await voucherService.getPhotoFile(
    parseId(req.params.id, "voucher id"),
    parseId(req.params.photoId, "photo id"),
  );
  res.type(photo.mimeType).sendFile(photo.filePath);
}

export async function downloadPhoto(req: Request, res: Response) {
  const photo = await voucherService.getPhotoFile(
    parseId(req.params.id, "voucher id"),
    parseId(req.params.photoId, "photo id"),
  );
  res.download(photo.filePath, photo.fileName);
}

export async function replace(req: Request, res: Response) {
  const actor = requireUser(req);
  const voucherId = parseId(req.params.id, "voucher id");
  const photoId = parseId(req.params.photoId, "photo id");
  const photos = toStoredPhotos(req);
  const photo = photos[0];
  if (!photo) {
    throw new HttpError(400, "A replacement photo must be uploaded");
  }
  const result = await voucherService.replacePhoto(
    actor.userId,
    voucherId,
    photoId,
    photo,
    clientIp(req),
  );
  res.json(result);
}

export async function removePhoto(req: Request, res: Response) {
  const actor = requireUser(req);
  const result = await voucherService.deletePhoto(
    actor.userId,
    parseId(req.params.id, "voucher id"),
    parseId(req.params.photoId, "photo id"),
    clientIp(req),
  );
  res.json(result);
}
