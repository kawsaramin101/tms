import { apiFetch } from "@/lib/api-client";
import type {
  CreateVoucherRequest,
  UpdateVoucherRequest,
  UpdateVoucherStatusRequest,
  VoucherDto,
  VoucherListResponse,
  VoucherPhotoDto,
  VoucherStatus,
} from "./types";

export interface VoucherListParams {
  search?: string;
  type?: string;
  status?: string;
  transactionId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function listVouchers(token: string, params: VoucherListParams = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.type) query.set("type", params.type);
  if (params.status) query.set("status", params.status);
  if (params.transactionId)
    query.set("transactionId", String(params.transactionId));
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<VoucherListResponse>(`/vouchers${qs ? `?${qs}` : ""}`, {
    token,
  });
}

export function getVoucher(token: string, id: number) {
  return apiFetch<VoucherDto>(`/vouchers/${id}`, { token });
}

export function createVoucher(token: string, data: CreateVoucherRequest) {
  return apiFetch<VoucherDto>("/vouchers", {
    method: "POST",
    token,
    body: data,
  });
}

export function updateVoucher(
  token: string,
  id: number,
  data: UpdateVoucherRequest,
) {
  return apiFetch<VoucherDto>(`/vouchers/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function updateVoucherStatus(
  token: string,
  id: number,
  status: VoucherStatus,
) {
  return apiFetch<VoucherDto>(`/vouchers/${id}/status`, {
    method: "PATCH",
    token,
    body: { status } satisfies UpdateVoucherStatusRequest,
  });
}

export function linkVoucherTransaction(
  token: string,
  id: number,
  transactionNumber: string,
) {
  return apiFetch<VoucherDto>(`/vouchers/${id}/link`, {
    method: "PATCH",
    token,
    body: { transactionNumber },
  });
}

export function deleteVoucher(token: string, id: number) {
  return apiFetch<{ message: string }>(`/vouchers/${id}`, {
    method: "DELETE",
    token,
  });
}

declare const process: { env: Record<string, string | undefined> };

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

async function uploadFetch<T>(
  token: string,
  path: string,
  method: string,
  form: FormData,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data && data.message) || `Request failed with status ${res.status}`,
    );
  }
  return data as T;
}

export function uploadVoucherPhotos(
  token: string,
  voucherId: number,
  files: File[],
) {
  const form = new FormData();
  for (const file of files) {
    form.append("photos", file);
  }
  return uploadFetch<VoucherPhotoDto[]>(
    token,
    `/vouchers/${voucherId}/photos`,
    "POST",
    form,
  );
}

export function replaceVoucherPhoto(
  token: string,
  voucherId: number,
  photoId: number,
  file: File,
) {
  const form = new FormData();
  form.append("photo", file);
  return uploadFetch<VoucherPhotoDto>(
    token,
    `/vouchers/${voucherId}/photos/${photoId}`,
    "PUT",
    form,
  );
}

export function deleteVoucherPhoto(
  token: string,
  voucherId: number,
  photoId: number,
) {
  return apiFetch<{ message: string }>(
    `/vouchers/${voucherId}/photos/${photoId}`,
    { method: "DELETE", token },
  );
}

export function voucherPhotoUrl(voucherId: number, photoId: number) {
  return `${API_URL}/vouchers/${voucherId}/photos/${photoId}`;
}

export async function fetchVoucherPhotoBlob(
  token: string,
  voucherId: number,
  photoId: number,
): Promise<Blob> {
  const res = await fetch(voucherPhotoUrl(voucherId, photoId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      (data && data.message) || `Request failed with status ${res.status}`,
    );
  }
  return res.blob();
}

export async function downloadVoucherPhoto(
  token: string,
  voucherId: number,
  photoId: number,
  fallbackName: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/vouchers/${voucherId}/photos/${photoId}/download`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      (data && data.message) || `Request failed with status ${res.status}`,
    );
  }
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = match?.[1] ?? fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
