import { z } from "zod";
import {
  MEMBER_STATUSES,
  FEE_TYPE_STATUSES,
  FEE_STATUSES,
  PAYMENT_METHODS,
} from "@tms/contracts";

const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date",
  });

export const createMemberSchema = z.object({
  memberCode: z.string().trim().min(1, "Member code is required").max(50),
  name: z.string().trim().min(1, "Name is required").max(100),
  memberType: z.string().trim().min(1, "Member type is required").max(50),
  department: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(150).optional(),
  address: z.string().optional(),
  status: z.enum(MEMBER_STATUSES).optional(),
});

export const updateMemberSchema = z
  .object({
    memberCode: z.string().trim().min(1).max(50).optional(),
    name: z.string().trim().min(1).max(100).optional(),
    memberType: z.string().trim().min(1).max(50).optional(),
    department: z.string().max(100).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    email: z.string().email().max(150).nullable().optional(),
    address: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateMemberStatusSchema = z.object({
  status: z.enum(MEMBER_STATUSES),
});

export const memberSearchSchema = z.object({
  q: z.string().optional(),
  memberType: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(MEMBER_STATUSES).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createFeeTypeSchema = z.object({
  feeName: z.string().trim().min(1, "Fee name is required").max(100),
  defaultAmount: z.number().min(0, "Amount must be non-negative"),
  description: z.string().optional(),
  status: z.enum(FEE_TYPE_STATUSES).optional(),
});

export const updateFeeTypeSchema = z
  .object({
    feeName: z.string().trim().min(1).max(100).optional(),
    defaultAmount: z.number().min(0).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(FEE_TYPE_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateFeeTypeStatusSchema = z.object({
  status: z.enum(FEE_TYPE_STATUSES),
});

export const createMemberFeeSchema = z.object({
  memberId: z.number().int().positive("Member is required"),
  feeTypeId: z.number().int().positive("Fee type is required"),
  amountDue: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  fine: z.number().min(0).optional(),
  dueDate: dateStringSchema,
  status: z.enum(FEE_STATUSES).optional(),
});

export const updateMemberFeeSchema = z
  .object({
    amountDue: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    fine: z.number().min(0).optional(),
    dueDate: dateStringSchema.optional(),
    status: z.enum(FEE_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateMemberFeeStatusSchema = z.object({
  status: z.enum(FEE_STATUSES),
});

export const createFeePaymentSchema = z.object({
  memberFeeId: z.number().int().positive("Member fee is required"),
  receiptNumber: z.string().min(1).max(50),
  amount: z.number().positive("Amount must be greater than 0"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  paymentDate: z.string().datetime({ offset: true }).optional(),
  referenceNumber: z.string().max(100).optional(),
  remarks: z.string().optional(),
});
