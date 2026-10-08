import { z } from "zod";
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from "@tms/contracts";

export const createTransactionSchema = z.object({
  accountId: z.number().int().positive("Account is required"),
  transactionType: z.enum(TRANSACTION_TYPES),
  category: z.string().max(100).optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().optional(),
  referenceNumber: z.string().max(100).optional(),
  transactionDate: z.string().datetime({ offset: true }).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
});

export const updateTransactionSchema = z
  .object({
    accountId: z.number().int().positive().optional(),
    transactionType: z.enum(TRANSACTION_TYPES).optional(),
    category: z.string().max(100).nullable().optional(),
    amount: z.number().positive().optional(),
    description: z.string().nullable().optional(),
    referenceNumber: z.string().max(100).nullable().optional(),
    transactionDate: z.string().datetime({ offset: true }).optional(),
    status: z.enum(TRANSACTION_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateTransactionStatusSchema = z.object({
  status: z.enum(TRANSACTION_STATUSES),
});

export const listTransactionsQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  accountId: z.coerce.number().int().positive().optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sortBy: z.enum(["date", "amount", "type"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const totalsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  accountId: z.coerce.number().int().positive().optional(),
});
