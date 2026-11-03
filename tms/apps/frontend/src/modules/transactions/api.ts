import { apiFetch } from "@/lib/api-client";
import type {
  AccountBalance,
  CreateTransactionRequest,
  TransactionDto,
  TransactionStatus,
  TransactionTotals,
  UpdateTransactionRequest,
} from "./types";

export interface TransactionListResponse {
  data: TransactionDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionListParams {
  search?: string;
  type?: string;
  accountId?: number;
  status?: string;
  from?: string;
  to?: string;
  sortBy?: "date" | "amount" | "type";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export function listTransactions(
  token: string,
  params: TransactionListParams = {},
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.type) query.set("type", params.type);
  if (params.accountId) query.set("accountId", String(params.accountId));
  if (params.status) query.set("status", params.status);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.order) query.set("order", params.order);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<TransactionListResponse>(`/transactions${qs ? `?${qs}` : ""}`, {
    token,
  });
}

export function getTransaction(token: string, id: number) {
  return apiFetch<TransactionDto>(`/transactions/${id}`, { token });
}

export function createTransaction(
  token: string,
  data: CreateTransactionRequest,
) {
  return apiFetch<TransactionDto>("/transactions", {
    method: "POST",
    token,
    body: data,
  });
}

export function updateTransaction(
  token: string,
  id: number,
  data: UpdateTransactionRequest,
) {
  return apiFetch<TransactionDto>(`/transactions/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function updateTransactionStatus(
  token: string,
  id: number,
  status: TransactionStatus,
) {
  return apiFetch<TransactionDto>(`/transactions/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}

export function deleteTransaction(token: string, id: number) {
  return apiFetch<{ message: string }>(`/transactions/${id}`, {
    method: "DELETE",
    token,
  });
}

export function getTransactionTotals(
  token: string,
  params: { from?: string; to?: string; accountId?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.accountId) query.set("accountId", String(params.accountId));
  const qs = query.toString();
  return apiFetch<TransactionTotals>(`/transactions/totals${qs ? `?${qs}` : ""}`, {
    token,
  });
}

export function getAccountBalance(token: string, accountId: number) {
  return apiFetch<AccountBalance>(`/transactions/accounts/${accountId}/balance`, {
    token,
  });
}
