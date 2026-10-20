import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
  recordId: z.coerce.number().int().positive().optional(),
  tableName: z.string().trim().min(1).max(100).optional(),
  userId: z.coerce.number().int().positive().optional(),
  action: z.string().trim().min(1).max(50).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

export const createVoucherPaymentSchema = z.object({
  accountId: z.number().int().positive("Account is required"),
  amount: z
    .number()
    .positive("Payment amount must be greater than 0")
    .max(9_999_999_999_999.99, "Payment amount is too large"),
  transactionDate: z.string().datetime({ offset: true }).optional(),
  referenceNumber: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
});

export type CreateVoucherPaymentInput = z.infer<
  typeof createVoucherPaymentSchema
>;
