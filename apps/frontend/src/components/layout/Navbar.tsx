"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, BookLock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Transactions", href: "/transactions" },
  { label: "Vouchers", href: "/vouchers" },
  { label: "Members", href: "/members" },
  { label: "Reports", href: "/reports" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <BookLock className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Vault
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ModeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 md:hidden">
          <ModeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-foreground"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-b border-border bg-background transition-[max-height] duration-200 ease-in-out md:hidden",
          open ? "max-h-80" : "max-h-0 border-b-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 pb-4 pt-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-sm px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            <Button variant="ghost" asChild className="justify-start">
              <Link href="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
            </Button>
            <Button asChild>
              <Link href="/register" onClick={() => setOpen(false)}>
                Get started
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
