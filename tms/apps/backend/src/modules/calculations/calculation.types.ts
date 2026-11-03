import type {
  PaymentStatus,
  VoucherPaymentDto,
  VoucherPaymentSummaryDto,
} from "@tms/contracts";

interface AuditLogRow {
  logId: number;
  action: string;
  tableName: string;
  recordId: number | null;
  description: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user: { userId: number; name: string; email: string } | null;
}
export interface AuditLogDto {
  logId: number;
  action: string;
  tableName: string;
  recordId: number | null;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
  userId: number;
  userName: string;
  userEmail: string | null;
}

export interface AuditLogListResponse {
  data: AuditLogDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function toAuditLogDto(row: AuditLogRow): AuditLogDto {
  return {
    logId: row.logId,
    action: row.action,
    tableName: row.tableName,
    recordId: row.recordId,
    description: row.description,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt.toISOString(),
    userId: row.user?.userId ?? 0,
    userName: row.user?.name ?? "Unknown user",
    userEmail: row.user?.email ?? null,
  };
}

const PAYMENT_DIRECTION_TYPES = ["PAYMENT", "DEBIT"];
const RECEIPT_DIRECTION_TYPES = ["RECEIPT", "CREDIT"];

export function qualifyingTransactionTypes(voucherType: string): string[] {
  if (voucherType === "PAYMENT") return PAYMENT_DIRECTION_TYPES;
  if (voucherType === "RECEIPT") return RECEIPT_DIRECTION_TYPES;
  return [...PAYMENT_DIRECTION_TYPES, ...RECEIPT_DIRECTION_TYPES];
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function derivePaymentStatus(
  voucherStatus: string,
  paidAmount: number,
  amount: number,
): PaymentStatus {
  if (voucherStatus === "CANCELLED") return "Cancelled";
  if (paidAmount <= 0) return "Unpaid";
  if (paidAmount >= amount) return "Paid";
  return "Partially Settled";
}

export interface PaymentTransactionRow {
  transactionId: number;
  transactionNumber: string;
  amount: unknown;
  transactionType: string;
  status: string;
  transactionDate: Date;
  referenceNumber: string | null;
  description: string | null;
  createdBy: number;
  createdAt: Date;
  creator: { name: string } | null;
}

export interface VoucherWithPaymentsRow {
  voucherId: number;
  voucherNumber: string;
  voucherType: string;
  amount: unknown;
  paidAmount: unknown;
  status: string;
  payments: PaymentTransactionRow[];
}

export function toVoucherPaymentDto(
  row: PaymentTransactionRow,
): VoucherPaymentDto {
  return {
    transactionId: row.transactionId,
    transactionNumber: row.transactionNumber,
    amount: Number(row.amount),
    transactionType: row.transactionType,
    status: row.status,
    transactionDate: row.transactionDate.toISOString(),
    referenceNumber: row.referenceNumber,
    description: row.description,
    createdBy: row.createdBy,
    creatorName: row.creator?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toVoucherPaymentSummary(
  row: VoucherWithPaymentsRow,
): VoucherPaymentSummaryDto {
  const amount = Number(row.amount);
  const paidAmount = roundMoney(Number(row.paidAmount));
  return {
    voucherId: row.voucherId,
    voucherNumber: row.voucherNumber,
    voucherType: row.voucherType,
    voucherStatus: row.status,
    amount,
    paidAmount,
    outstandingAmount: roundMoney(Math.max(0, amount - paidAmount)),
    paymentStatus: derivePaymentStatus(row.status, paidAmount, amount),
    payments: row.payments.map(toVoucherPaymentDto),
  };
}
