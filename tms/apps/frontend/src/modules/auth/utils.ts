import type { UserRole } from "./types";

export function isAdmin(role?: UserRole | null): boolean {
  return role === "ADMIN";
}

export function formatRole(role: UserRole): string {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
