export const MEMBER_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export interface MemberDto {
  memberId: number;
  memberCode: string;
  name: string;
  memberType: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: MemberStatus;
  createdAt: string;
}

export interface CreateMemberRequest {
  memberCode: string;
  name: string;
  memberType: string;
  department?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  address?: string | undefined;
  status?: MemberStatus | undefined;
}

export interface UpdateMemberRequest {
  memberCode?: string | undefined;
  name?: string | undefined;
  memberType?: string | undefined;
  department?: string | null | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  address?: string | null | undefined;
}

export interface UpdateMemberStatusRequest {
  status: MemberStatus;
}

export const FEE_STATUSES = [
  "PENDING",
  "PARTIAL",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;
export type FeeStatus = (typeof FEE_STATUSES)[number];

export const FEE_TYPE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type FeeTypeStatus = (typeof FEE_TYPE_STATUSES)[number];

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CARD",
  "MOBILE_BANKING",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface FeeTypeDto {
  feeTypeId: number;
  feeName: string;
  defaultAmount: number;
  description: string | null;
  status: FeeTypeStatus;
}

export interface CreateFeeTypeRequest {
  feeName: string;
  defaultAmount: number;
  description?: string | undefined;
  status?: FeeTypeStatus | undefined;
}

export interface UpdateFeeTypeRequest {
  feeName?: string | undefined;
  defaultAmount?: number | undefined;
  description?: string | null | undefined;
  status?: FeeTypeStatus | undefined;
}

export interface MemberFeeDto {
  memberFeeId: number;
  memberId: number;
  feeTypeId: number;
  amountDue: number;
  amountPaid: number;
  discount: number;
  fine: number;
  dueDate: string;
  status: FeeStatus;
  createdAt: string;
}

export interface CreateMemberFeeRequest {
  memberId: number;
  feeTypeId: number;
  amountDue?: number | undefined;
  discount?: number | undefined;
  fine?: number | undefined;
  dueDate: string;
  status?: FeeStatus | undefined;
}

export interface UpdateMemberFeeRequest {
  amountDue?: number | undefined;
  discount?: number | undefined;
  fine?: number | undefined;
  dueDate?: string | undefined;
  status?: FeeStatus | undefined;
}

export interface FeePaymentDto {
  paymentId: number;
  memberFeeId: number;
  receiptNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber: string | null;
  receivedBy: number;
  remarks: string | null;
}

export interface CreateFeePaymentRequest {
  memberFeeId: number;
  receiptNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string | undefined;
  referenceNumber?: string | undefined;
  remarks?: string | undefined;
}