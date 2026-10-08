import type { TransactionDto } from "@tms/contracts";
import type { Transaction } from "@prisma/client";

export function toTransactionDto(t: Transaction): TransactionDto {
  return {
    transactionId: t.transactionId,
    transactionNumber: t.transactionNumber,
    accountId: t.accountId,
    transactionType: t.transactionType,
    category: t.category,
    amount: Number(t.amount),
    description: t.description,
    referenceNumber: t.referenceNumber,
    transactionDate: t.transactionDate.toISOString(),
    status: t.status,
    createdBy: t.createdBy,
    createdAt: t.createdAt.toISOString(),
  };
}
