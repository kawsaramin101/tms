import { apiFetch } from "@/lib/api-client";
import type {
  CreateNotificationRequest,
  NotificationDto,
  NotificationListResponse,
  NotificationPreferencesDto,
  NotificationQuery,
  NotificationStatsDto,
  ReminderCheckResultDto,
  UpdateNotificationPreferencesRequest,
} from "./types";

export function listNotifications(
  token: string,
  params: NotificationQuery = {},
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.notificationType) query.set("notificationType", params.notificationType);
  if (params.isRead !== undefined) query.set("isRead", String(params.isRead));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.order) query.set("order", params.order);
  const qs = query.toString();
  return apiFetch<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ""}`, {
    token,
  });
}

export function getNotification(token: string, id: number) {
  return apiFetch<NotificationDto>(`/notifications/${id}`, { token });
}

export function createNotification(
  token: string,
  data: CreateNotificationRequest,
) {
  return apiFetch<NotificationDto[]>("/notifications", {
    method: "POST",
    token,
    body: data,
  });
}

export function markAsRead(token: string, id: number) {
  return apiFetch<NotificationDto>(`/notifications/${id}/read`, {
    method: "PATCH",
    token,
  });
}

export function markAllAsRead(token: string) {
  return apiFetch<{ count: number }>("/notifications/read-all", {
    method: "POST",
    token,
  });
}

export function deleteNotification(token: string, id: number) {
  return apiFetch<{ success: boolean }>(`/notifications/${id}`, {
    method: "DELETE",
    token,
  });
}

export function clearAllNotifications(token: string) {
  return apiFetch<{ deleted: number }>("/notifications/clear", {
    method: "DELETE",
    token,
  });
}

export function getUnreadCount(token: string) {
  return apiFetch<{ unreadCount: number }>("/notifications/unread-count", {
    token,
  });
}

export function getNotificationStats(token: string) {
  return apiFetch<NotificationStatsDto>("/notifications/stats", { token });
}

export function getNotificationPreferences(token: string) {
  return apiFetch<NotificationPreferencesDto>("/notifications/preferences", {
    token,
  });
}

export function updateNotificationPreferences(
  token: string,
  data: UpdateNotificationPreferencesRequest,
) {
  return apiFetch<NotificationPreferencesDto>("/notifications/preferences", {
    method: "PUT",
    token,
    body: data,
  });
}

export function runReminderScan(token: string) {
  return apiFetch<ReminderCheckResultDto>("/notifications/run-reminders", {
    method: "POST",
    token,
  });
}
