
import { apiFetch } from "@/lib/api-client";
import type {
  MemberDto,
  CreateMemberRequest,
  UpdateMemberRequest,
  UpdateMemberStatusRequest,
  FeeTypeDto,
  CreateFeeTypeRequest,
  UpdateFeeTypeRequest,
  FeeTypeStatus,
  MemberFeeDto,
  CreateMemberFeeRequest,
  UpdateMemberFeeRequest,
  FeeStatus,
  FeePaymentDto,
  CreateFeePaymentRequest,
} from "./types";

export function listMembers(token: string) {
  return apiFetch<MemberDto[]>("/members-fees/members", { token });
}

export function searchMembers(
  token: string,
  params: {
    q?: string;
    memberType?: string;
    department?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  const qs = query.toString();

  return apiFetch<unknown>(
    `/members-fees/members/search${qs ? `?${qs}` : ""}`,
    { token },
  );
}

export function getMember(token: string, id: number) {
  return apiFetch<MemberDto>(`/members-fees/members/${id}`, { token });
}

export function createMember(
  token: string,
  data: CreateMemberRequest,
) {
  return apiFetch<MemberDto>("/members-fees/members", {
    method: "POST",
    token,
    body: data,
  });
}

export function updateMember(
  token: string,
  id: number,
  data: UpdateMemberRequest,
) {
  return apiFetch<MemberDto>(`/members-fees/members/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function updateMemberStatus(
  token: string,
  id: number,
  data: UpdateMemberStatusRequest,
) {
  return apiFetch<MemberDto>(`/members-fees/members/${id}/status`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function listFeeTypes(token: string) {
  return apiFetch<FeeTypeDto[]>("/members-fees/fee-types", { token });
}

export function getFeeType(token: string, id: number) {
  return apiFetch<FeeTypeDto>(`/members-fees/fee-types/${id}`, { token });
}

export function createFeeType(
  token: string,
  data: CreateFeeTypeRequest,
) {
  return apiFetch<FeeTypeDto>("/members-fees/fee-types", {
    method: "POST",
    token,
    body: data,
  });
}

export function updateFeeType(
  token: string,
  id: number,
  data: UpdateFeeTypeRequest,
) {
  return apiFetch<FeeTypeDto>(`/members-fees/fee-types/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function updateFeeTypeStatus(
  token: string,
  id: number,
  status: FeeTypeStatus,
) {
  return apiFetch<FeeTypeDto>(`/members-fees/fee-types/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}

export function listMemberFees(token: string) {
  return apiFetch<MemberFeeDto[]>("/members-fees/member-fees", { token });
}

export function getMemberFee(token: string, id: number) {
  return apiFetch<MemberFeeDto>(`/members-fees/member-fees/${id}`, { token });
}

export function createMemberFee(
  token: string,
  data: CreateMemberFeeRequest,
) {
  return apiFetch<MemberFeeDto>("/members-fees/member-fees", {
    method: "POST",
    token,
    body: data,
  });
}

export function deleteMember(token: string, id: number) {
  return apiFetch<void>(`/members-fees/members/${id}`, {
    method: "DELETE",
    token,
  });
}

export function deleteMemberFee(token: string, id: number) {
  return apiFetch<void>(`/members-fees/member-fees/${id}`, {
    method: "DELETE",
    token,
  });
}

export function updateMemberFee(
  token: string,
  id: number,
  data: UpdateMemberFeeRequest,
) {
  return apiFetch<MemberFeeDto>(`/members-fees/member-fees/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function updateMemberFeeStatus(
  token: string,
  id: number,
  status: FeeStatus,
) {
  return apiFetch<MemberFeeDto>(`/members-fees/member-fees/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}

export function listFeePayments(token: string) {
  return apiFetch<FeePaymentDto[]>("/members-fees/fee-payments", { token });
}

export function getFeePayment(token: string, id: number) {
  return apiFetch<FeePaymentDto>(`/members-fees/fee-payments/${id}`, { token });
}

export function createFeePayment(
  token: string,
  data: CreateFeePaymentRequest,
) {
  return apiFetch<FeePaymentDto>("/members-fees/fee-payments", {
    method: "POST",
    token,
    body: data,
  });
}
