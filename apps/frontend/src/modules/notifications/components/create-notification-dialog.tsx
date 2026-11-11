"use client";

import { useState } from "react";
import { getToken } from "@/lib/auth";
import { createNotification } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BellPlus, Check, Loader2, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateNotificationDialog({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState<string>("SYSTEM");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    if (!title.trim() || !message.trim()) {
      setError("Title and message are required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await createNotification(token, {
        title: title.trim(),
        message: message.trim(),
        notificationType,
        userId: userId ? Number(userId) : undefined,
      });

      setSuccess(true);
      setTitle("");
      setMessage("");
      setUserId("");
      if (onCreated) onCreated();

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to create notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <BellPlus className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Send Notification / Reminder
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            <span>Notification sent successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notification-type">Notification Type</Label>
            <select
              id="notification-type"
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="SYSTEM">System Announcement</option>
              <option value="PAYMENT_REMINDER">Payment Reminder</option>
              <option value="DUE_DATE_REMINDER">Due Date Reminder</option>
              <option value="TRANSACTION">Transaction Alert</option>
              <option value="TASK_REMINDER">Task Reminder</option>
              <option value="LOW_INVENTORY">Low Inventory Alert</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Monthly Treasury Report Submission"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              rows={3}
              placeholder="Enter notification details..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-id">
              Target User ID <span className="text-muted-foreground font-normal">(Leave empty to broadcast to Admins/Treasurers)</span>
            </Label>
            <Input
              id="user-id"
              type="number"
              placeholder="All active staff (Broadcast)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Notification"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
