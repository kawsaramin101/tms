export type {
  NotificationType,
  NotificationDto,
  CreateNotificationRequest,
  NotificationQuery,
  NotificationStatsDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesRequest,
  ReminderCheckResultDto,
} from "@tms/contracts";

export interface NotificationListResponse {
  data: import("@tms/contracts").NotificationDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
