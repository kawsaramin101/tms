"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KeyRound, LogOut, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdmin } from "../utils";
import { useLogout } from "../hooks/use-logout";
import type { UserDto } from "../types";

export function ProfileDropdown({ user }: { user: UserDto | null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { logout, loggingOut } = useLogout();

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const menuItemClass =
    "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Profile"
      >
        <User className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {user ? (
            <div className="border-b border-border bg-muted/40 px-3 py-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          ) : null}

          <div className="p-1">
            <Link
              href="/change-password"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={menuItemClass}
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </Link>
            {isAdmin(user?.role) ? (
              <Link
                href="/users"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuItemClass}
              >
                <Users className="h-4 w-4" />
                Users
              </Link>
            ) : null}
          </div>

          <div className="border-t border-border p-1">
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              disabled={loggingOut}
              className={cn(
                menuItemClass,
                "text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
              )}
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
