import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeftRight,
  Receipt,
  Calculator,
  Users,
  BarChart3,
  Bell,
  DatabaseBackup,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const MODULES = [
  {
    icon: ShieldCheck,
    title: "Access control",
    description: "Role-based logins so only the right people touch the books.",
  },
  {
    icon: ArrowLeftRight,
    title: "Transaction tracking",
    description: "Every rupee in and out, logged and searchable.",
  },
  {
    icon: Receipt,
    title: "Voucher management",
    description: "Attach photo proof to every entry and keep it on record.",
  },
  {
    icon: Calculator,
    title: "Auto calculation",
    description: "Balances update themselves as vouchers come in.",
  },
  {
    icon: Users,
    title: "Member & fee tracking",
    description: "See who's paid, who hasn't, and chase it in one click.",
  },
  {
    icon: BarChart3,
    title: "Reporting",
    description: "A live status view of the fund, no spreadsheet required.",
  },
  {
    icon: Bell,
    title: "Reminders",
    description: "Automatic nudges before dues and deadlines slip by.",
  },
  {
    icon: DatabaseBackup,
    title: "Backup & security",
    description: "Records stay safe and recoverable, always.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              One ledger for every rupee the class handles.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Vault replaces the shared spreadsheet and the group-chat
              screenshots with a single record — who paid, what was spent,
              and proof for both.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              What it keeps track of
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MODULES.map((mod) => (
                <Card
                  key={mod.title}
                  className="border-border shadow-none transition-colors hover:border-foreground/20"
                >
                  <CardHeader>
                    <mod.icon
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.75}
                    />
                    <CardTitle className="mt-3 text-base font-semibold">
                      {mod.title}
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                      {mod.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Vault — Inventory & Treasury Management</span>
          <span>Built by the class, for the class.</span>
        </div>
      </footer>
      npm install lucide-react    </div>
  );
}
