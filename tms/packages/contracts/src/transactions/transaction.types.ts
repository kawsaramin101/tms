export const TRANSACTION_TYPES = [
  "CREDIT",
  "DEBIT",
  "PAYMENT",
  "RECEIPT",
  "TRANSFER",
  "ADJUSTMENT",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = [
  "PENDING",
  "COMPLETED",
  "CANCELLED",
] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export interface TransactionDto {
  transactionId: number;
  transactionNumber: string;
  accountId: number;
  transactionType: string;
  category: string | null;
  amount: number;
  description: string | null;
  referenceNumber: string | null;
  transactionDate: string;
  status: string;
  createdBy: number;
  createdAt: string;
}

export interface CreateTransactionRequest {
  accountId: number;
  transactionType: TransactionType;
  category?: string | undefined;
  amount: number;
  description?: string | undefined;
  referenceNumber?: string | undefined;
  transactionDate?: string | undefined;
  status?: TransactionStatus | undefined;
}

export interface UpdateTransactionRequest {
  accountId?: number | undefined;
  transactionType?: TransactionType | undefined;
  category?: string | null | undefined;
  amount?: number | undefined;
  description?: string | null | undefined;
  referenceNumber?: string | null | undefined;
  transactionDate?: string | undefined;
  status?: TransactionStatus | undefined;
}

export interface UpdateTransactionStatusRequest {
  status: TransactionStatus;
}

export interface TransactionTotals {
  from: string | null;
  to: string | null;
  count: number;
  totalAmount: number;
  byType: Array<{ transactionType: string; count: number; totalAmount: number }>;
  byAccount: Array<{ accountId: number; count: number; totalAmount: number }>;
}

export interface AccountBalance {
  accountId: number;
  openingBalance: number;
  totalCredit: number;
  totalDebit: number;
  runningBalance: number;
}
