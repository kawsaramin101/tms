import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "@tms/contracts";

export const loginSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("A valid email is required").max(150),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().max(20).optional(),
  role: z.enum(USER_ROLES),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().max(150).optional(),
    phone: z.string().max(20).nullable().optional(),
    role: z.enum(USER_ROLES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateUserStatusSchema = z.object({
  status: z.enum(USER_STATUSES),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});
