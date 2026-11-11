"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { getNotificationPreferences, updateNotificationPreferences } from "../api";
import type { NotificationPreferencesDto } from "../types";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Settings2, Sliders, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function NotificationPreferencesDialog({ open, onClose, onSaved }: Props) {
  const [preferences, setPreferences] = useState<NotificationPreferencesDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    getNotificationPreferences(token)
      .then((data) => setPreferences(data))
      .catch((err) => setError(err.message || "Failed to load preferences"))
      .finally(() => setLoading(false));
  }, [open]);

  const handleToggle = (key: keyof Omit<NotificationPreferencesDto, "userId" | "updatedAt">) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleSave = async () => {
    if (!preferences) return;
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateNotificationPreferences(token, {
        transactionNotifications: preferences.transactionNotifications,
        paymentReminders: preferences.paymentReminders,
        dueDateReminders: preferences.dueDateReminders,
        lowInventoryAlerts: preferences.lowInventoryAlerts,
        taskReminders: preferences.taskReminders,
      });
      setSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || "Failed to update notification settings");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Notification Preferences
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

        <p className="text-xs text-muted-foreground">
          Customize which automatic reminders and notifications you receive across the inventory and treasury system. (FR-06 & FR-09)
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-8 text-sm text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading preferences...</span>
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : preferences ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Task Reminders (FR-06)</p>
                <p className="text-xs text-muted-foreground">
                  Receive alerts for upcoming deadlines and task activities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("taskReminders")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  preferences.taskReminders ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.taskReminders ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Payment Reminders (FR-02)</p>
                <p className="text-xs text-muted-foreground">
                  Get notified for pending member fees and incoming payments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("paymentReminders")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  preferences.paymentReminders ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.paymentReminders ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Due Date Reminders (FR-04)</p>
                <p className="text-xs text-muted-foreground">
                  Alerts when items or vouchers approach due date or become overdue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("dueDateReminders")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  preferences.dueDateReminders ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.dueDateReminders ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Transaction Alerts (FR-01)</p>
                <p className="text-xs text-muted-foreground">
                  Instant notifications for newly posted financial entries.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("transactionNotifications")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  preferences.transactionNotifications ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.transactionNotifications ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Low Stock Alerts (FR-10)</p>
                <p className="text-xs text-muted-foreground">
                  Warnings when inventory item quantities fall at or below threshold.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("lowInventoryAlerts")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  preferences.lowInventoryAlerts ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.lowInventoryAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        ) : null}

        {success && (
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
