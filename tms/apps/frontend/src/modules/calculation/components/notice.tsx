import { cn } from "@/lib/utils";

interface NoticeProps {
  children: React.ReactNode;
  tone?: "info" | "warning";
}

export function Notice({ children, tone = "info" }: NoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        tone === "warning"
          ? "border-amber-500/40 bg-amber-500/10 text-foreground"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}
