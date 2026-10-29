import type { ExportTable } from "@/modules/calculation/types";
import { roundMoney } from "@/modules/calculation/utils";
import type { ReconciliationRow } from "./types";

export { exportCsv, exportExcel } from "@/modules/calculation/utils";
export function formatCurrency(value: number | null | undefined): string { return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(Number(value ?? 0)); }
export function formatDate(value: string | Date | null | undefined): string { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }); }
export function varianceTone(value: number): "positive" | "negative" | "neutral" { if (value > 0) return "positive"; if (value < 0) return "negative"; return "neutral"; }
export function buildReconciliationRows(vouchers: Array<{ voucherNumber: string; transactionId: number; amount: number }>, transactions: Array<{ transactionId: number; transactionNumber: string; amount: number }>): ReconciliationRow[] {
  const byId = new Map(transactions.map((transaction) => [transaction.transactionId, transaction]));
  const matched = new Set<number>(); const rows: ReconciliationRow[] = [];
  for (const voucher of vouchers) { const transaction = byId.get(voucher.transactionId); if (!transaction) { rows.push({ status: "Unmatched", voucherNumber: voucher.voucherNumber, transactionNumber: null, expectedAmount: null, actualAmount: Number(voucher.amount), difference: null }); continue; } matched.add(transaction.transactionId); const expectedAmount = Number(transaction.amount); const actualAmount = Number(voucher.amount); const difference = roundMoney(actualAmount - expectedAmount); rows.push({ status: difference === 0 ? "Matched" : "Amount Mismatch", voucherNumber: voucher.voucherNumber, transactionNumber: transaction.transactionNumber, expectedAmount, actualAmount, difference }); }
  for (const transaction of transactions) if (!matched.has(transaction.transactionId)) rows.push({ status: "Unmatched", voucherNumber: null, transactionNumber: transaction.transactionNumber, expectedAmount: Number(transaction.amount), actualAmount: null, difference: null });
  return rows;
}
export function tableFromRows(headers: string[], rows: Array<Array<string | number>>): ExportTable { return { headers, rows: rows.map((row) => row.map(String)) }; }
