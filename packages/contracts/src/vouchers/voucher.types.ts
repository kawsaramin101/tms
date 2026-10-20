export const VOUCHER_TYPES = [
  "PAYMENT",
  "RECEIPT",
  "JOURNAL",
  "CONTRA",
  "TRANSFER",
] as const;

export type VoucherType = (typeof VOUCHER_TYPES)[number];

export const VOUCHER_STATUSES = [
  "PENDING",
  "SUBMITTED",
  "VERIFIED",
  "APPROVED",
  "REJECTED",
  "PAID",
  "CANCELLED",
] as const;

export type VoucherStatus = (typeof VOUCHER_STATUSES)[number];

export interface VoucherPhotoDto {
  photoId: number;
  voucherId: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: number;
  uploaderName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherDto {
  voucherId: number;
  voucherNumber: string;
  transactionId: number;
  transactionNumber: string;
  voucherType: string;
  amount: number;
  description: string | null;
  status: string;
  createdBy: number;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  photos: VoucherPhotoDto[];
  photoCount: number;
}

export interface CreateVoucherRequest {
  transactionNumber: string;
  voucherType: VoucherType;
  amount: number;
  description?: string | undefined;
  status?: VoucherStatus | undefined;
}

export interface UpdateVoucherRequest {
  voucherType?: VoucherType | undefined;
  amount?: number | undefined;
  description?: string | null | undefined;
  status?: VoucherStatus | undefined;
}

export interface UpdateVoucherStatusRequest {
  status: VoucherStatus;
}

export interface LinkTransactionRequest {
  transactionNumber: string;
}

export interface VoucherListResponse {
  data: VoucherDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const PAYMENT_STATUSES = [
  "Unpaid",
  "Partially Settled",
  "Paid",
  "Cancelled",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface VoucherPaymentDto {
  transactionId: number;
  transactionNumber: string;
  amount: number;
  transactionType: string;
  status: string;
  transactionDate: string;
  referenceNumber: string | null;
  description: string | null;
  createdBy: number;
  creatorName: string | null;
  createdAt: string;
}

export interface VoucherPaymentSummaryDto {
  voucherId: number;
  voucherNumber: string;
  voucherType: string;
  voucherStatus: string;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: PaymentStatus;
  payments: VoucherPaymentDto[];
}

export interface VoucherPaymentTotalsDto {
  voucherId: number;
  voucherType: string;
  voucherStatus: string;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: PaymentStatus;
}

export interface CreateVoucherPaymentRequest {
  accountId: number;
  amount: number;
  transactionDate?: string | undefined;
  referenceNumber?: string | undefined;
  description?: string | undefined;
}

