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

export interface AuditLogParams {
  recordId?: number;
  tableName?: string;
  userId?: number;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const AUDIT_TABLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "users", label: "Users & auth" },
  { value: "vouchers", label: "Vouchers" },
  { value: "transactions", label: "Transactions" },
  { value: "members", label: "Members" },
  { value: "fee_types", label: "Fee types" },
  { value: "member_fees", label: "Member fees" },
  { value: "fee_payments", label: "Fee payments" },
];

export const VOUCHER_AUDIT_ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "UPDATE_STATUS",
  "LINK_TRANSACTION",
  "DELETE",
  "UPLOAD_PHOTO",
  "REPLACE_PHOTO",
  "DELETE_PHOTO",
] as const;

export const AUDIT_ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "UPDATE_STATUS",
  "LINK_TRANSACTION",
  "DELETE",
  "UPLOAD_PHOTO",
  "REPLACE_PHOTO",
  "DELETE_PHOTO",
  "LOGIN",
  "LOGOUT",
  "CHANGE_PASSWORD",
  "CREATE_USER",
  "UPDATE_USER",
  "ACTIVATE_USER",
  "DEACTIVATE_USER",
  "CREATE_MEMBER",
  "UPDATE_MEMBER",
  "ACTIVATE_MEMBER",
  "DEACTIVATE_MEMBER",
  "CREATE_FEE_TYPE",
  "UPDATE_FEE_TYPE",
  "ACTIVATE_FEE_TYPE",
  "DEACTIVATE_FEE_TYPE",
  "CREATE_MEMBER_FEE",
  "UPDATE_MEMBER_FEE",
  "UPDATE_MEMBER_FEE_STATUS",
  "CREATE_FEE_PAYMENT",
  "CREATE_PAYMENT",
  "REVERSE_PAYMENT",
] as const;

export type {
  CreateVoucherPaymentRequest,
  PaymentStatus,
  VoucherPaymentDto,
  VoucherPaymentSummaryDto,
  VoucherPaymentTotalsDto,
} from "@tms/contracts";

export type SettlementStatus = "Unpaid" | "Partially Settled" | "Paid" | "Cancelled";

export interface SettlementSummary {
  totalAmount: number;
  totalSettled: number;
  outstanding: number;
}

export interface FinancialTotals {
  income: number;
  expenditure: number;
  net: number;
  otherAmount: number;
  otherCount: number;
}

export type ReconciliationStatus = "Matched" | "Unmatched" | "Amount Mismatch";

export interface ReconciliationRow {
  status: ReconciliationStatus;
  voucherNumber: string | null;
  transactionNumber: string | null;
  expectedAmount: number | null;
  actualAmount: number | null;
  difference: number | null;
}

export interface AccountBalanceRow {
  accountId: number;
  accountName: string;
  accountType: string;
  status: string;
  openingBalance: number;
  totalCredit: number;
  totalDebit: number;
  remainingBalance: number;
}

export interface ExportTable {
  headers: string[];
  rows: string[][];
}

export type TrackingTabKey = "audit" | "reports" | "financial";

export type ReportSectionKey = "outstanding" | "reconciliation";
