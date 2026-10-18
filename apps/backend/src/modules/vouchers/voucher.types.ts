import type { VoucherDto, VoucherPhotoDto } from "@tms/contracts";

interface PhotoWithUploader {
  photoId: number;
  voucherId: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: number;
  createdAt: Date;
  updatedAt: Date;
  uploader: { name: string } | null;
}

interface VoucherWithPhotos {
  voucherId: number;
  voucherNumber: string;
  transactionId: number;
  transaction: { transactionNumber: string };
  voucherType: string;
  amount: unknown;
  description: string | null;
  status: string;
  createdBy: number;
  approvedBy: number | null;
  approvedAt: Date | null;
  createdAt: Date;
  photos: PhotoWithUploader[];
}

export function toVoucherPhotoDto(p: PhotoWithUploader): VoucherPhotoDto {
  return {
    photoId: p.photoId,
    voucherId: p.voucherId,
    fileName: p.fileName,
    mimeType: p.mimeType,
    fileSize: p.fileSize,
    uploadedBy: p.uploadedBy,
    uploaderName: p.uploader?.name ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toVoucherDto(v: VoucherWithPhotos): VoucherDto {
  const photos = v.photos.map(toVoucherPhotoDto);
  return {
    voucherId: v.voucherId,
    voucherNumber: v.voucherNumber,
    transactionId: v.transactionId,
    transactionNumber: v.transaction.transactionNumber,
    voucherType: v.voucherType,
    amount: Number(v.amount),
    description: v.description,
    status: v.status,
    createdBy: v.createdBy,
    approvedBy: v.approvedBy,
    approvedAt: v.approvedAt ? v.approvedAt.toISOString() : null,
    createdAt: v.createdAt.toISOString(),
    photos,
    photoCount: photos.length,
  };
}
