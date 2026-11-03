import { apiFetch } from "@/lib/api-client";
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  LoginResponse,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserDto,
} from "./types";

export function login(email: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function logout(token: string) {
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
    token,
  });
}

export function getMe(token: string) {
  return apiFetch<UserDto>("/auth/me", { token });
}

export function changePassword(token: string, data: ChangePasswordRequest) {
  return apiFetch<{ message: string }>("/auth/change-password", {
    method: "POST",
    token,
    body: data,
  });
}

export function listUsers(token: string) {
  return apiFetch<UserDto[]>("/auth/users", { token });
}

export function createUser(token: string, data: CreateUserRequest) {
  return apiFetch<UserDto>("/auth/users", { method: "POST", token, body: data });
}

export function updateUser(token: string, id: number, data: UpdateUserRequest) {
  return apiFetch<UserDto>(`/auth/users/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function updateUserStatus(
  token: string,
  id: number,
  data: UpdateUserStatusRequest,
) {
  return apiFetch<UserDto>(`/auth/users/${id}/status`, {
    method: "PATCH",
    token,
    body: data,
  });
}
