"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink, RefreshCw } from "lucide-react";
import { getToken } from "@/lib/auth";
import {
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markAsRead,
} from "../api";
import type { NotificationDto } from "../types";
import { formatRelativeTime, getNotificationBadgeColor, getNotificationTypeLabel } from "../utils";

export function NotificationBadgeButton() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await getUnreadCount(token);
      setUnreadCount(res.unreadCount);
    } catch {
      // silently ignore if not logged in
    }
  };

  const fetchRecent = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await listNotifications(token, { limit: 5 });
      setRecentNotifications(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRecent();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await markAllAsRead(token);
      setUnreadCount(0);
      setRecentNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOne = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await markAsRead(token, id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setRecentNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-100 dark:bg-rose-950 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                  {unreadCount} new
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  All caught up
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-muted"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading notifications...</span>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <p>No notifications yet</p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  You will receive reminders and transaction updates here.
                </p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.notificationId}
                  onClick={() => !n.isRead && handleMarkOne(n.notificationId)}
                  className={`p-3 text-left transition-colors cursor-pointer hover:bg-muted/60 ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium border ${getNotificationBadgeColor(
                          n.notificationType
                        )}`}
                      >
                        {getNotificationTypeLabel(n.notificationType)}
                      </span>
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>
                  <h4 className="mt-1 text-xs font-semibold text-foreground line-clamp-1">
                    {n.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border bg-muted/30 p-2 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline py-1 w-full"
            >
              <span>View all notifications & reminders</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
