import fs from "node:fs";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/error.middleware.js";
import { toVoucherDto, toVoucherPhotoDto } from "./voucher.types.js";
import type {
  CreateVoucherRequest,
  UpdateVoucherRequest,
  VoucherDto,
  VoucherPhotoDto,
  VoucherStatus,
} from "@tms/contracts";

const PHOTOS_INCLUDE = {
  photos: { include: { uploader: { select: { name: true } } } },
  transaction: { select: { transactionNumber: true } },
} as const;

export interface StoredPhoto {
  fileName: string;
  storedName: string;
  storedPath: string;
  mimeType: string;
  fileSize: number;
}

async function writeAudit(
  actorId: number,
  action: string,
  recordId: number | null,
  description: string,
  ipAddress?: string,
) {
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      tableName: "vouchers",
      recordId,
      description,
      ipAddress: ipAddress ?? null,
    },
  });
}

function buildWhere(query: {
  search?: string | undefined;
  type?: string | undefined;
  status?: string | undefined;
  transactionId?: number | undefined;
  from?: string | undefined;
  to?: string | undefined;
}) {
  return {
    ...(query.type ? { voucherType: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.transactionId ? { transactionId: query.transactionId } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { voucherNumber: { contains: query.search } },
            { description: { contains: query.search } },
          ],
        }
      : {}),
  };
}

export async function listVouchers(query: {
  search?: string | undefined;
  type?: string | undefined;
  status?: string | undefined;
  transactionId?: number | undefined;
  from?: string | undefined;
  to?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const where = buildWhere(query);
  const [total, rows] = await Promise.all([
    prisma.voucher.count({ where }),
    prisma.voucher.findMany({
      where,
      include: PHOTOS_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return {
    data: rows.map(toVoucherDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getVoucher(id: number): Promise<VoucherDto> {
  const v = await prisma.voucher.findUnique({
    where: { voucherId: id },
    include: PHOTOS_INCLUDE,
  });
  if (!v) throw new HttpError(404, "Voucher not found");
  return toVoucherDto(v);
}

export async function createVoucher(
  actorId: number,
  body: CreateVoucherRequest,
  ipAddress?: string,
): Promise<VoucherDto> {
  const transaction = await prisma.transaction.findUnique({
    where: { transactionNumber: body.transactionNumber },
  });
  if (!transaction) throw new HttpError(404, "Transaction not found");

  const voucherNumber = `VCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created = await prisma.voucher.create({
    data: {
      voucherNumber,
      transactionId: transaction.transactionId,
      voucherType: body.voucherType,
      amount: body.amount,
      description: body.description ?? null,
      status: body.status ?? "PENDING",
      createdBy: actorId,
    },
    include: PHOTOS_INCLUDE,
  });
  await writeAudit(
    actorId,
    "CREATE",
    created.voucherId,
    `Created voucher ${created.voucherNumber}`,
    ipAddress,
  );
  return toVoucherDto(created);
}

export async function updateVoucher(
  actorId: number,
  id: number,
  body: UpdateVoucherRequest,
  ipAddress?: string,
): Promise<VoucherDto> {
  const existing = await prisma.voucher.findUnique({
    where: { voucherId: id },
  });
  if (!existing) throw new HttpError(404, "Voucher not found");

  const updated = await prisma.voucher.update({
    where: { voucherId: id },
    data: {
      ...(body.voucherType !== undefined
        ? { voucherType: body.voucherType }
        : {}),
      ...(body.amount !== undefined ? { amount: body.amount } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
    include: PHOTOS_INCLUDE,
  });
  await writeAudit(
    actorId,
    "UPDATE",
    id,
    `Updated voucher ${updated.voucherNumber}`,
    ipAddress,
  );
  return toVoucherDto(updated);
}

export async function updateVoucherStatus(
  actorId: number,
  id: number,
  status: VoucherStatus,
  ipAddress?: string,
): Promise<VoucherDto> {
  const existing = await prisma.voucher.findUnique({
    where: { voucherId: id },
  });
  if (!existing) throw new HttpError(404, "Voucher not found");
  const data: { status: string; approvedBy?: number | null; approvedAt?: Date | null } = {
    status,
  };
  if (status === "APPROVED") {
    data.approvedBy = actorId;
    data.approvedAt = new Date();
  }
  const updated = await prisma.voucher.update({
    where: { voucherId: id },
    data,
    include: PHOTOS_INCLUDE,
  });
  await writeAudit(
    actorId,
    "UPDATE_STATUS",
    id,
    `Voucher ${updated.voucherNumber} status set to ${status}`,
    ipAddress,
  );
  return toVoucherDto(updated);
}

export async function linkTransaction(
  actorId: number,
  id: number,
  transactionNumber: string,
  ipAddress?: string,
): Promise<VoucherDto> {
  const existing = await prisma.voucher.findUnique({
    where: { voucherId: id },
  });
  if (!existing) throw new HttpError(404, "Voucher not found");
  const transaction = await prisma.transaction.findUnique({
    where: { transactionNumber },
  });
  if (!transaction) throw new HttpError(404, "Transaction not found");

  const updated = await prisma.voucher.update({
    where: { voucherId: id },
    data: { transactionId: transaction.transactionId },
    include: PHOTOS_INCLUDE,
  });
  await writeAudit(
    actorId,
    "LINK_TRANSACTION",
    id,
    `Linked voucher ${updated.voucherNumber} to transaction ${transaction.transactionNumber}`,
    ipAddress,
  );
  return toVoucherDto(updated);
}

export async function deleteVoucher(
  actorId: number,
  id: number,
  ipAddress?: string,
) {
  const existing = await prisma.voucher.findUnique({
    where: { voucherId: id },
    include: { photos: true },
  });
  if (!existing) throw new HttpError(404, "Voucher not found");
  await prisma.voucher.delete({ where: { voucherId: id } });
  for (const photo of existing.photos) {
    try {
      fs.unlinkSync(photo.filePath);
    } catch {
      // File may already be gone; DB row is removed via cascade.
    }
  }
  await writeAudit(
    actorId,
    "DELETE",
    id,
    `Deleted voucher ${existing.voucherNumber}`,
    ipAddress,
  );
  return { message: "Voucher deleted" };
}

export async function addPhotos(
  actorId: number,
  voucherId: number,
  files: StoredPhoto[],
  ipAddress?: string,
): Promise<VoucherPhotoDto[]> {
  const existing = await prisma.voucher.findUnique({
    where: { voucherId },
  });
  if (!existing) {
    for (const f of files) {
      try {
        fs.unlinkSync(f.storedPath);
      } catch {
        // Best effort cleanup.
      }
    }
    throw new HttpError(404, "Voucher not found");
  }
  const created = await prisma.$transaction(
    files.map((f) =>
      prisma.voucherPhoto.create({
        data: {
          voucherId,
          fileName: f.fileName,
          filePath: f.storedPath,
          mimeType: f.mimeType,
          fileSize: f.fileSize,
          uploadedBy: actorId,
        },
        include: { uploader: { select: { name: true } } },
      }),
    ),
  );
  await writeAudit(
    actorId,
    "UPLOAD_PHOTO",
    voucherId,
    `Uploaded ${created.length} photo(s) to voucher ${existing.voucherNumber}`,
    ipAddress,
  );
  return created.map(toVoucherPhotoDto);
}

export async function replacePhoto(
  actorId: number,
  voucherId: number,
  photoId: number,
  file: StoredPhoto,
  ipAddress?: string,
): Promise<VoucherPhotoDto> {
  const existing = await prisma.voucherPhoto.findFirst({
    where: { photoId, voucherId },
    include: { voucher: true },
  });
  if (!existing) {
    try {
      fs.unlinkSync(file.storedPath);
    } catch {
      // Best effort cleanup.
    }
    throw new HttpError(404, "Voucher photo not found");
  }
  const updated = await prisma.voucherPhoto.update({
    where: { photoId },
    data: {
      fileName: file.fileName,
      filePath: file.storedPath,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      uploadedBy: actorId,
    },
    include: { uploader: { select: { name: true } } },
  });
  try {
    fs.unlinkSync(existing.filePath);
  } catch {
    // Old file may already be gone.
  }
  await writeAudit(
    actorId,
    "REPLACE_PHOTO",
    voucherId,
    `Replaced photo on voucher ${existing.voucher.voucherNumber}`,
    ipAddress,
  );
  return toVoucherPhotoDto(updated);
}

export async function deletePhoto(
  actorId: number,
  voucherId: number,
  photoId: number,
  ipAddress?: string,
) {
  const existing = await prisma.voucherPhoto.findFirst({
    where: { photoId, voucherId },
    include: { voucher: true },
  });
  if (!existing) throw new HttpError(404, "Voucher photo not found");
  await prisma.voucherPhoto.delete({ where: { photoId } });
  try {
    fs.unlinkSync(existing.filePath);
  } catch {
    // File may already be gone.
  }
  await writeAudit(
    actorId,
    "DELETE_PHOTO",
    voucherId,
    `Deleted photo from voucher ${existing.voucher.voucherNumber}`,
    ipAddress,
  );
  return { message: "Voucher photo deleted" };
}

export async function getPhotoFile(voucherId: number, photoId: number) {
  const photo = await prisma.voucherPhoto.findFirst({
    where: { photoId, voucherId },
  });
  if (!photo) throw new HttpError(404, "Voucher photo not found");
  return photo;
}
