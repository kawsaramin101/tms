import { z } from "zod";

export const createAccountSchema = z.object({
  accountName: z.string().min(1, "Name is required").max(100),
  accountType: z.string().min(1, "Type is required").max(50),
  accountNumber: z.string().max(100).optional(),
  openingBalance: z.number().min(0).optional(),
});

export const updateAccountSchema = z
  .object({
    accountName: z.string().min(1).max(100).optional(),
    accountType: z.string().min(1).max(50).optional(),
    accountNumber: z.string().max(100).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
