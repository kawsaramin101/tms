"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2, RefreshCw, Settings2, CreditCard, Package, ReceiptText, Info } from "lucide-react";
import { getToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteNotification, getNotificationPreferences, listNotifications,
  markAllNotificationsRead, markNotificationRead, updateNotificationPreferences,
} from "@/modules/notifications/api";
import type { NotificationDto, NotificationPreferencesDto } from "@/modules/notifications/types";

type Tab = "all" | "unread" | "settings";
const preferenceLabels: Array<{ key: keyof NotificationPreferencesDto; label: string; description: string }> = [
  { key: "transaction", label: "Transaction alerts", description: "When a new financial transaction is recorded" },
  { key: "paymentReminder", label: "Payment reminders", description: "Payments due today or tomorrow" },
  { key: "paymentOverdue", label: "Overdue payments", description: "Unpaid member fees past their due date" },
  { key: "lowInventory", label: "Low inventory alerts", description: "Items below their minimum stock quantity" },
  { key: "taskReminder", label: "Task reminders", description: "Reserved for task reminders when task management is added" },
];
function relativeDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function TypeIcon({ type }: { type: string | null }) {
  if (type?.includes("PAYMENT")) return <CreditCard className="h-5 w-5" />;
  if (type === "LOW_INVENTORY") return <Package className="h-5 w-5" />;
  if (type === "TRANSACTION") return <ReceiptText className="h-5 w-5" />;
  return <Info className="h-5 w-5" />;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferencesDto | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const token = useMemo(() => getToken(), []);

  const refresh = useCallback(async () => {
    if (!token) { setError("Please sign in to view notifications."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const result = await listNotifications(token);
      setItems(result.data); setUnreadCount(result.unreadCount);
      const prefs = await getNotificationPreferences(token);
      setPreferences(prefs);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load notifications."); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void refresh(); }, [refresh]);

  const visibleItems = tab === "unread" ? items.filter((n) => !n.isRead) : items;
  async function markRead(id: number) {
    if (!token) return;
    try { await markNotificationRead(token, id); setItems((old) => old.map((n) => n.notificationId === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)); setUnreadCount((n) => Math.max(0, n - 1)); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update notification."); }
  }
  async function markAllRead() {
    if (!token) return;
    try { await markAllNotificationsRead(token); setItems((old) => old.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }))); setUnreadCount(0); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not mark all as read."); }
  }
  async function remove(id: number) {
    if (!token) return;
    const target = items.find((n) => n.notificationId === id);
    try { await deleteNotification(token, id); setItems((old) => old.filter((n) => n.notificationId !== id)); if (target && !target.isRead) setUnreadCount((n) => Math.max(0, n - 1)); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not delete notification."); }
  }
  async function togglePreference(key: keyof NotificationPreferencesDto, value: boolean) {
    if (!token || !preferences) return;
    const previous = preferences; setPreferences({ ...preferences, [key]: value }); setSaving(true);
    try { setPreferences(await updateNotificationPreferences(token, { [key]: value })); }
    catch (e) { setPreferences(previous); setError(e instanceof Error ? e.message : "Could not save preferences."); }
    finally { setSaving(false); }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><Bell className="h-6 w-6" /><h1 className="text-2xl font-semibold">Notifications</h1></div><p className="mt-1 text-sm text-muted-foreground">Stay updated on transactions, payments and inventory.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>{unreadCount > 0 && <Button onClick={() => void markAllRead()}><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button>}</div>
      </div>
      {error && <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div className="flex gap-1">{([ ["all", "All"], ["unread", `Unread (${unreadCount})`], ["settings", "Preferences"] ] as const).map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`border-b-2 px-4 py-3 text-sm font-medium ${tab === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</button>)}</div>
        <Badge variant="secondary">{unreadCount} unread</Badge>
      </div>
      {tab === "settings" ? (
        <div className="rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Settings2 className="h-5 w-5" /><h2 className="font-semibold">Notification preferences</h2></div><p className="mb-5 text-sm text-muted-foreground">Choose which types of alerts you want to receive.</p>
          {preferences ? <div className="divide-y divide-border">{preferenceLabels.map(({ key, label, description }) => <label key={key} className="flex cursor-pointer items-center justify-between gap-4 py-4"><span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></span><input type="checkbox" className="h-4 w-4 accent-primary" checked={preferences[key]} disabled={saving} onChange={(e) => void togglePreference(key, e.target.checked)} /></label>)}</div> : <p className="text-sm text-muted-foreground">Loading preferences…</p>}
        </div>
      ) : loading ? <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">Loading notifications…</div> : visibleItems.length === 0 ? <div className="rounded-xl border border-dashed border-border p-12 text-center"><Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h2 className="font-medium">{tab === "unread" ? "You're all caught up" : "No notifications yet"}</h2><p className="mt-1 text-sm text-muted-foreground">New updates will appear here.</p></div> : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">{visibleItems.map((item) => <article key={item.notificationId} className={`flex gap-4 border-b border-border p-4 last:border-b-0 ${!item.isRead ? "bg-primary/[0.035]" : ""}`}><div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><TypeIcon type={item.notificationType} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{item.title}</h3>{!item.isRead && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}{item.notificationType && <Badge variant="outline">{item.notificationType.replaceAll("_", " ")}</Badge>}</div><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">{relativeDate(item.createdAt)}</p></div><div className="flex shrink-0 items-start gap-1">{!item.isRead && <Button size="sm" variant="ghost" onClick={() => void markRead(item.notificationId)}>Mark read</Button>}<Button size="icon" variant="ghost" aria-label="Delete notification" onClick={() => void remove(item.notificationId)}><Trash2 className="h-4 w-4" /></Button></div></article>)}</div>
      )}
      <p className="text-xs text-muted-foreground">Notification history is shown newest first. Your notification settings apply to future alerts.</p>
    </section>
  );
}
