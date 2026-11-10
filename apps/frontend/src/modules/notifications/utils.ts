export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getNotificationTypeLabel(type: string | null): string {
  switch (type) {
    case "TRANSACTION":
      return "Transaction";
    case "PAYMENT_REMINDER":
      return "Payment Reminder";
    case "DUE_DATE_REMINDER":
      return "Due Date Alert";
    case "LOW_INVENTORY":
      return "Low Inventory";
    case "TASK_REMINDER":
      return "Task Reminder";
    case "SYSTEM":
    default:
      return "System";
  }
}

export function getNotificationBadgeColor(type: string | null): string {
  switch (type) {
    case "TRANSACTION":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
    case "PAYMENT_REMINDER":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
    case "DUE_DATE_REMINDER":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
    case "LOW_INVENTORY":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20";
    case "TASK_REMINDER":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
    case "SYSTEM":
    default:
      return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20";
  }
}
