import { apiFetch } from "@/lib/api-client";
import type {
  AccountDto,
  CreateAccountRequest,
  UpdateAccountRequest,
} from "./types";

export function listAccounts(token: string) {
  return apiFetch<AccountDto[]>("/accounts", { token });
}

export function getAccount(token: string, id: number) {
  return apiFetch<AccountDto>(`/accounts/${id}`, { token });
}

export function createAccount(token: string, data: CreateAccountRequest) {
  return apiFetch<AccountDto>("/accounts", {
    method: "POST",
    token,
    body: data,
  });
}

export function updateAccount(
  token: string,
  id: number,
  data: UpdateAccountRequest,
) {
  return apiFetch<AccountDto>(`/accounts/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function deleteAccount(token: string, id: number) {
  return apiFetch<{ message: string }>(`/accounts/${id}`, {
    method: "DELETE",
    token,
  });
}
