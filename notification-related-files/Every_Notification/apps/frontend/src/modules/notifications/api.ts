import { apiFetch } from "@/lib/api-client";
import type { NotificationListResponse, NotificationPreferencesDto } from "./types";
export function listNotifications(token: string, unreadOnly = false) {
  return apiFetch<NotificationListResponse>(`/notifications?limit=100${unreadOnly ? "&unreadOnly=true" : ""}`, { token });
}
export function markNotificationRead(token: string, id: number) {
  return apiFetch(`/notifications/${id}/read`, { method: "PATCH", token });
}
export function markAllNotificationsRead(token: string) {
  return apiFetch<{ updated: number }>("/notifications/read-all", { method: "PATCH", token });
}
export function deleteNotification(token: string, id: number) {
  return apiFetch<{ message: string }>(`/notifications/${id}`, { method: "DELETE", token });
}
export function getNotificationPreferences(token: string) {
  return apiFetch<NotificationPreferencesDto>("/notifications/preferences", { token });
}
export function updateNotificationPreferences(token: string, body: Partial<NotificationPreferencesDto>) {
  return apiFetch<NotificationPreferencesDto>("/notifications/preferences", { method: "PATCH", token, body });
}
