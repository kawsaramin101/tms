"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import {
  clearAllNotifications,
  deleteNotification,
  getNotificationStats,
  listNotifications,
  markAllAsRead,
  markAsRead,
  runReminderScan,
} from "@/modules/notifications/api";
import type { NotificationDto, NotificationStatsDto } from "@/modules/notifications/types";
import {
  formatDateTime,
  formatRelativeTime,
  getNotificationBadgeColor,
  getNotificationTypeLabel,
} from "@/modules/notifications/utils";
import { NotificationPreferencesDialog } from "@/modules/notifications/components/notification-preferences-dialog";
import { CreateNotificationDialog } from "@/modules/notifications/components/create-notification-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellPlus,
  Check,
  CheckCheck,
  Clock,
  Filter,
  Play,
  RefreshCw,
  Search,
  Sliders,
  Trash2,
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [stats, setStats] = useState<NotificationStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [filterRead, setFilterRead] = useState<string>(""); // "", "false", "true"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scanning, setScanning] = useState(false);

  // Dialogs
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await getNotificationStats(token);
      setStats(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("Please log in to view notifications.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await listNotifications(token, {
        search: search.trim() || undefined,
        notificationType: selectedType || undefined,
        isRead: filterRead === "true" ? true : filterRead === "false" ? false : undefined,
        page,
        limit: 15,
        order: "desc",
      });

      setNotifications(res.data);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, filterRead, page]);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  const handleMarkRead = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await markAsRead(token, id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      fetchStats();
    } catch (err: any) {
      setError(err.message || "Failed to mark as read.");
    }
  };

  const handleMarkAllRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await markAllAsRead(token);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      fetchStats();
      setActionMessage("All notifications marked as read.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to mark all as read.");
    }
  };

  const handleDelete = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await deleteNotification(token, id);
      setNotifications((prev) => prev.filter((n) => n.notificationId !== id));
      fetchStats();
    } catch (err: any) {
      setError(err.message || "Failed to delete notification.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all your notifications?")) return;
    const token = getToken();
    if (!token) return;
    try {
      await clearAllNotifications(token);
      setNotifications([]);
      fetchStats();
      setActionMessage("Notification history cleared.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to clear notifications.");
    }
  };

  const handleRunReminders = async () => {
    const token = getToken();
    if (!token) return;
    setScanning(true);
    try {
      const res = await runReminderScan(token);
      setActionMessage(
        `Scanned ${res.scannedPayments} pending fees & ${res.scannedItems} items. Created ${res.notificationsCreated} new reminder(s).`
      );
      fetchNotifications();
      fetchStats();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to scan reminders.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Notifications & Reminders
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage transactions, payment due dates, low stock alerts, and task reminder settings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunReminders}
            disabled={scanning}
            title="Scan upcoming due dates & low inventory immediately"
          >
            {scanning ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-1.5 h-3.5 w-3.5 text-primary" />
            )}
            Run Reminder Scan
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreferencesOpen(true)}
            title="Configure task & reminder preferences"
          >
            <Sliders className="mr-1.5 h-3.5 w-3.5" />
            Task Settings
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5"
          >
            <BellPlus className="h-3.5 w-3.5" />
            New Notification
          </Button>
        </div>
      </div>

      {/* Action status message banner */}
      {actionMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300 animate-in fade-in-0">
          <Check className="h-4 w-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total History</span>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {stats ? stats.total : "-"}
          </p>
          <span className="text-[11px] text-muted-foreground">All logged alerts</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Unread</span>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats ? stats.unread : "-"}
          </p>
          <span className="text-[11px] text-muted-foreground">Needs review</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Payment & Due Dates</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats
              ? (stats.byType["PAYMENT_REMINDER"] || 0) +
                (stats.byType["DUE_DATE_REMINDER"] || 0)
              : "-"}
          </p>
          <span className="text-[11px] text-muted-foreground">Fees & deadlines</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Low Stock Alerts</span>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats ? stats.byType["LOW_INVENTORY"] || 0 : "-"}
          </p>
          <span className="text-[11px] text-muted-foreground">Threshold triggered</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notification title or message..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="PAYMENT_REMINDER">Payment Reminders</option>
            <option value="DUE_DATE_REMINDER">Due Date Reminders</option>
            <option value="TRANSACTION">Transactions</option>
            <option value="LOW_INVENTORY">Low Inventory</option>
            <option value="TASK_REMINDER">Task Reminders</option>
            <option value="SYSTEM">System</option>
          </select>

          <select
            value={filterRead}
            onChange={(e) => {
              setFilterRead(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Status</option>
            <option value="false">Unread Only</option>
            <option value="true">Read Only</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs"
            title="Mark all notifications as read"
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            Mark all read
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-destructive hover:bg-destructive/10"
            title="Clear all notifications"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading notification history...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No notifications found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              There are no notifications matching your current filters. Upcoming payment reminders and transaction updates will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div
                key={n.notificationId}
                className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 ${
                  !n.isRead ? "bg-primary/5" : ""
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium border ${getNotificationBadgeColor(
                        n.notificationType
                      )}`}
                    >
                      {getNotificationTypeLabel(n.notificationType)}
                    </span>
                    {!n.isRead ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Unread
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Read</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      • {formatRelativeTime(n.createdAt)} ({formatDateTime(n.createdAt)})
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground">
                    {n.title}
                  </h3>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {n.message}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {!n.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkRead(n.notificationId)}
                      className="h-8 text-xs gap-1"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(n.notificationId)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <NotificationPreferencesDialog
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        onSaved={fetchNotifications}
      />

      <CreateNotificationDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          fetchNotifications();
          fetchStats();
        }}
      />
    </div>
  );
}
