"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Audit Trail", href: "/calculation/audit-trail" },
  { label: "Reports & Reconciliation", href: "/calculation/reports" },
];

export function TrackingTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Voucher tracking sections"
      className="flex flex-wrap gap-1 rounded-md border border-border bg-muted/40 p-1"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
