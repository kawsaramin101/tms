import { z } from "zod";
import { VOUCHER_STATUSES, VOUCHER_TYPES } from "@tms/contracts";

export const createVoucherSchema = z.object({
  transactionNumber: z.string().trim().min(1, "Transaction number is required"),
  voucherType: z.enum(VOUCHER_TYPES),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().optional(),
  status: z.enum(VOUCHER_STATUSES).optional(),
});

export const updateVoucherSchema = z
  .object({
    voucherType: z.enum(VOUCHER_TYPES).optional(),
    amount: z.number().positive().optional(),
    description: z.string().nullable().optional(),
    status: z.enum(VOUCHER_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateVoucherStatusSchema = z.object({
  status: z.enum(VOUCHER_STATUSES),
});

export const linkTransactionSchema = z.object({
  transactionNumber: z.string().trim().min(1, "Transaction number is required"),
});

export const listVouchersQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(VOUCHER_TYPES).optional(),
  status: z.enum(VOUCHER_STATUSES).optional(),
  transactionId: z.coerce.number().int().positive().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
