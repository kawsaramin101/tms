import type { TransactionTotals } from "@/modules/transactions/types";
import type { VoucherDto } from "@/modules/vouchers/types";
import type { TransactionDto } from "@/modules/transactions/types";
import type {
  ExportTable,
  FinancialTotals,
  ReconciliationRow,
  SettlementStatus,
  SettlementSummary,
} from "./types";
import { AUDIT_TABLE_OPTIONS } from "./types";

export { formatCurrency, formatDate } from "@/modules/vouchers/utils";

const INCOME_TYPES = ["CREDIT", "RECEIPT"];
const EXPENDITURE_TYPES = ["DEBIT", "PAYMENT"];
const NON_OUTSTANDING_STATUSES = ["CANCELLED"];

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })} ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function toPeriodStart(date: string): string | undefined {
  return date ? `${date}T00:00:00.000` : undefined;
}

export function toPeriodEnd(date: string): string | undefined {
  return date ? `${date}T23:59:59.999` : undefined;
}

export function computeFinancialTotals(totals: TransactionTotals): FinancialTotals {
  let income = 0;
  let expenditure = 0;
  let otherAmount = 0;
  let otherCount = 0;
  for (const row of totals.byType) {
    const amount = Number(row.totalAmount);
    if (INCOME_TYPES.includes(row.transactionType)) {
      income += amount;
    } else if (EXPENDITURE_TYPES.includes(row.transactionType)) {
      expenditure += amount;
    } else {
      otherAmount += amount;
      otherCount += row.count;
    }
  }
  return {
    income: roundMoney(income),
    expenditure: roundMoney(expenditure),
    net: roundMoney(income - expenditure),
    otherAmount: roundMoney(otherAmount),
    otherCount,
  };
}

export function deriveSettlementStatus(
  settled: number,
  amount: number,
): SettlementStatus {
  if (settled <= 0) return "Unpaid";
  if (settled >= amount) return "Paid";
  return "Partially Settled";
}

export function settlementSummary(
  vouchers: VoucherDto[],
  paidByVoucher?: Map<number, number>,
): SettlementSummary {
  let totalAmount = 0;
  let totalSettled = 0;
  let outstanding = 0;
  for (const voucher of vouchers) {
    if (NON_OUTSTANDING_STATUSES.includes(voucher.status)) continue;
    const amount = Number(voucher.amount);
    const settled = Math.min(paidByVoucher?.get(voucher.voucherId) ?? 0, amount);
    totalAmount += amount;
    totalSettled += settled;
    outstanding += amount - settled;
  }
  return {
    totalAmount: roundMoney(totalAmount),
    totalSettled: roundMoney(totalSettled),
    outstanding: roundMoney(outstanding),
  };
}

export function isOutstandingVoucher(voucher: VoucherDto): boolean {
  return !NON_OUTSTANDING_STATUSES.includes(voucher.status);
}

export function auditTableLabel(tableName: string): string {
  const option = AUDIT_TABLE_OPTIONS.find((t) => t.value === tableName);
  return option ? option.label : tableName;
}

export function auditActionLabel(
  action: string,
  tableName: string,
  description: string | null,
): string {
  const entity =
    tableName === "vouchers"
      ? "Voucher"
      : tableName === "transactions"
        ? "Transaction"
        : tableName === "users"
          ? "User"
          : tableName === "members"
            ? "Member"
            : tableName === "member_fees"
              ? "Member fee"
              : tableName === "fee_payments"
                ? "Fee payment"
                : tableName === "fee_types"
                  ? "Fee type"
                  : "Record";
  switch (action) {
    case "CREATE":
      return `${entity} created`;
    case "UPDATE":
      return `${entity} updated`;
    case "UPDATE_STATUS":
      if (description?.includes("APPROVED")) return "Voucher approved";
      if (description?.includes("REJECTED")) return "Voucher rejected";
      return `${entity} status updated`;
    case "LINK_TRANSACTION":
      return "Voucher linked to transaction";
    case "CREATE_PAYMENT":
      return "Voucher payment recorded";
    case "REVERSE_PAYMENT":
      return "Voucher payment reversed";
    case "DELETE":
      return `${entity} deleted`;
    case "UPLOAD_PHOTO":
      return "Document uploaded";
    case "REPLACE_PHOTO":
      return "Document updated";
    case "DELETE_PHOTO":
      return "Document removed";
    case "LOGIN":
      return "User logged in";
    case "LOGOUT":
      return "User logged out";
    case "CHANGE_PASSWORD":
      return "Password changed";
    case "CREATE_USER":
      return "User created";
    case "UPDATE_USER":
      return "User updated";
    case "ACTIVATE_USER":
      return "User activated";
    case "DEACTIVATE_USER":
      return "User deactivated";
    case "CREATE_MEMBER":
      return "Member created";
    case "UPDATE_MEMBER":
      return "Member updated";
    case "ACTIVATE_MEMBER":
      return "Member activated";
    case "DEACTIVATE_MEMBER":
      return "Member deactivated";
    case "CREATE_FEE_TYPE":
      return "Fee type created";
    case "UPDATE_FEE_TYPE":
      return "Fee type updated";
    case "ACTIVATE_FEE_TYPE":
      return "Fee type activated";
    case "DEACTIVATE_FEE_TYPE":
      return "Fee type deactivated";
    case "CREATE_MEMBER_FEE":
      return "Member fee created";
    case "UPDATE_MEMBER_FEE":
      return "Member fee updated";
    case "UPDATE_MEMBER_FEE_STATUS":
      return "Member fee status updated";
    case "CREATE_FEE_PAYMENT":
      return "Fee payment recorded";
    default:
      return action;
  }
}

export function auditCategory(action: string, tableName: string): string {
  if (tableName === "vouchers") {
    switch (action) {
      case "CREATE":
        return "Voucher";
      case "UPDATE":
      case "UPDATE_STATUS":
        return "Voucher";
      case "LINK_TRANSACTION":
        return "Voucher";
      case "CREATE_PAYMENT":
      case "REVERSE_PAYMENT":
        return "Voucher";
      case "DELETE":
        return "Voucher";
      case "UPLOAD_PHOTO":
      case "REPLACE_PHOTO":
      case "DELETE_PHOTO":
        return "Document";
    }
  }
  switch (action) {
    case "LOGIN":
    case "LOGOUT":
    case "CHANGE_PASSWORD":
      return "Authentication";
    case "CREATE_USER":
    case "UPDATE_USER":
    case "ACTIVATE_USER":
    case "DEACTIVATE_USER":
      return "User";
    case "CREATE":
    case "UPDATE":
    case "UPDATE_STATUS":
    case "DELETE":
      return "Record";
    default:
      if (action.endsWith("_FEE") || action.includes("FEE")) return "Fee";
      if (action.includes("MEMBER")) return "Member";
      return "Record";
  }
}

export function buildReconciliationRows(
  vouchers: VoucherDto[],
  transactions: TransactionDto[],
): ReconciliationRow[] {
  const byId = new Map<number, TransactionDto>();
  for (const transaction of transactions) {
    byId.set(transaction.transactionId, transaction);
  }
  const voucherTransactionIds = new Set<number>();
  const rows: ReconciliationRow[] = [];
  for (const voucher of vouchers) {
    const transaction = byId.get(voucher.transactionId);
    if (transaction) {
      voucherTransactionIds.add(transaction.transactionId);
      const expected = Number(transaction.amount);
      const actual = Number(voucher.amount);
      const difference = roundMoney(actual - expected);
      rows.push({
        status: difference === 0 ? "Matched" : "Amount Mismatch",
        voucherNumber: voucher.voucherNumber,
        transactionNumber: transaction.transactionNumber,
        expectedAmount: expected,
        actualAmount: actual,
        difference,
      });
    } else {
      rows.push({
        status: "Unmatched",
        voucherNumber: voucher.voucherNumber,
        transactionNumber: null,
        expectedAmount: null,
        actualAmount: Number(voucher.amount),
        difference: null,
      });
    }
  }
  for (const transaction of transactions) {
    if (voucherTransactionIds.has(transaction.transactionId)) continue;
    rows.push({
      status: "Unmatched",
      voucherNumber: null,
      transactionNumber: transaction.transactionNumber,
      expectedAmount: Number(transaction.amount),
      actualAmount: null,
      difference: null,
    });
  }
  return rows;
}

export function averageApprovalHours(
  vouchers: VoucherDto[],
): { average: number | null; approvedCount: number; timedCount: number } {
  const timed: number[] = [];
  for (const voucher of vouchers) {
    if (voucher.status === "APPROVED" && voucher.approvedAt) {
      const created = new Date(voucher.createdAt).getTime();
      const approved = new Date(voucher.approvedAt).getTime();
      if (approved >= created) {
        timed.push((approved - created) / 3_600_000);
      }
    }
  }
  const approvedCount = vouchers.filter((v) => v.status === "APPROVED").length;
  if (timed.length === 0) {
    return { average: null, approvedCount, timedCount: 0 };
  }
  const total = timed.reduce((sum, value) => sum + value, 0);
  return {
    average: roundMoney(total / timed.length),
    approvedCount,
    timedCount: timed.length,
  };
}

export function countByStatus(
  vouchers: VoucherDto[],
): Array<{ status: string; count: number }> {
  const counts = new Map<string, number>();
  for (const voucher of vouchers) {
    counts.set(voucher.status, (counts.get(voucher.status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function escapeCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportCsv(table: ExportTable, filename: string): void {
  const lines = [table.headers.map(escapeCsv).join(",")];
  for (const row of table.rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportExcel(table: ExportTable, filename: string): void {
  const head = table.headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("");
  const body = table.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  const html = `<html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const blob = new Blob(["\uFEFF", html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  downloadBlob(blob, `${filename}.xls`);
}
