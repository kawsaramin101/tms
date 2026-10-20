import { apiFetch } from "@/lib/api-client";
import {
  getAccountBalance,
  listTransactions,
  type TransactionListParams,
} from "@/modules/transactions/api";
import {
  listVouchers,
  type VoucherListParams,
} from "@/modules/vouchers/api";
import type { AccountDto } from "@/modules/accounts/types";
import type { VoucherDto } from "@/modules/vouchers/types";
import type { TransactionDto } from "@/modules/transactions/types";
import type {
  BudgetVsActualReport,
  CreateVoucherPaymentRequest,
  FinancialReconciliationReport,
  TransactionVoucherStatusReport,
  VoucherPaymentSummaryDto,
  VoucherPaymentTotalsDto,
} from "@tms/contracts";
import type {
  AccountBalanceRow,
  AuditLogListResponse,
  AuditLogParams,
} from "./types";
import { roundMoney } from "./utils";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

export interface FetchAllResult<T> {
  rows: T[];
  truncated: boolean;
}

interface ReportEnvelope<T> {
  success: boolean;
  data: T;
}

export interface AccountBalancesResult {
  rows: AccountBalanceRow[];
  failedCount: number;
}

export async function fetchAccountBalances(
  token: string,
  accounts: AccountDto[],
): Promise<AccountBalancesResult> {
  const results = await Promise.all(
    accounts.map(async (account) => {
      try {
        const balance = await getAccountBalance(token, account.accountId);
        return {
          accountId: account.accountId,
          accountName: account.accountName,
          accountType: account.accountType,
          status: account.status,
          openingBalance: balance.openingBalance,
          totalCredit: roundMoney(balance.totalCredit),
          totalDebit: roundMoney(balance.totalDebit),
          remainingBalance: roundMoney(balance.runningBalance),
        } satisfies AccountBalanceRow;
      } catch {
        return null;
      }
    }),
  );
  const rows = results.filter((row): row is AccountBalanceRow => row !== null);
  return { rows, failedCount: results.length - rows.length };
}

export async function fetchAllVouchers(
  token: string,
  params: Omit<VoucherListParams, "page" | "limit"> = {},
): Promise<FetchAllResult<VoucherDto>> {
  const rows: VoucherDto[] = [];
  let page = 1;
  let totalPages = 1;
  let truncated = false;
  for (;;) {
    const res = await listVouchers(token, { ...params, page, limit: PAGE_SIZE });
    rows.push(...res.data);
    totalPages = res.pagination.totalPages || 1;
    if (page >= totalPages) break;
    if (page >= MAX_PAGES) {
      truncated = true;
      break;
    }
    page += 1;
  }
  return { rows, truncated };
}

export async function fetchAllTransactions(
  token: string,
  params: Omit<TransactionListParams, "page" | "limit"> = {},
): Promise<FetchAllResult<TransactionDto>> {
  const rows: TransactionDto[] = [];
  let page = 1;
  let totalPages = 1;
  let truncated = false;
  for (;;) {
    const res = await listTransactions(token, {
      ...params,
      page,
      limit: PAGE_SIZE,
    });
    rows.push(...res.data);
    totalPages = res.pagination.totalPages || 1;
    if (page >= totalPages) break;
    if (page >= MAX_PAGES) {
      truncated = true;
      break;
    }
    page += 1;
  }
  return { rows, truncated };
}

export function fetchAuditLogs(token: string, params: AuditLogParams = {}) {
  const query = new URLSearchParams();
  if (params.recordId) query.set("recordId", String(params.recordId));
  if (params.tableName) query.set("tableName", params.tableName);
  if (params.userId) query.set("userId", String(params.userId));
  if (params.action) query.set("action", params.action);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<AuditLogListResponse>(
    `/calculations/audit-logs${qs ? `?${qs}` : ""}`,
    { token },
  );
}

export function getTransactionVoucherStatusReport(token: string) {
  return apiFetch<ReportEnvelope<TransactionVoucherStatusReport>>(
    "/reports/transaction-voucher-status",
    { token },
  ).then((res) => res.data);
}

export function getBudgetVsActualReport(token: string) {
  return apiFetch<ReportEnvelope<BudgetVsActualReport[]>>(
    "/reports/budget-vs-actual",
    { token },
  ).then((res) => res.data);
}

export function getFinancialReconciliationReport(token: string) {
  return apiFetch<ReportEnvelope<FinancialReconciliationReport>>(
    "/reports/financial-reconciliation",
    { token },
  ).then((res) => res.data);
}

export async function fetchVoucherPaymentTotals(
  token: string,
): Promise<VoucherPaymentTotalsDto[]> {
  return apiFetch<VoucherPaymentTotalsDto[]>("/calculations/voucher-payments", {
    token,
  });
}

export async function getVoucherPayments(
  token: string,
  voucherId: number,
): Promise<VoucherPaymentSummaryDto> {
  return apiFetch<VoucherPaymentSummaryDto>(
    `/calculations/vouchers/${voucherId}/payments`,
    { token },
  );
}

export async function createVoucherPayment(
  token: string,
  voucherId: number,
  data: CreateVoucherPaymentRequest,
): Promise<VoucherPaymentSummaryDto> {
  return apiFetch<VoucherPaymentSummaryDto>(
    `/calculations/vouchers/${voucherId}/payments`,
    { method: "POST", token, body: data },
  );
}

export async function reverseVoucherPayment(
  token: string,
  voucherId: number,
  transactionId: number,
): Promise<VoucherPaymentSummaryDto> {
  return apiFetch<VoucherPaymentSummaryDto>(
    `/calculations/vouchers/${voucherId}/payments/${transactionId}/reverse`,
    { method: "POST", token },
  );
}
