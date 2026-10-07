"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import {
  listTransactions,
  getTransactionTotals,
} from "@/modules/transactions/api";
import type { TransactionDto, TransactionTotals } from "@/modules/transactions/types";
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from "@/modules/transactions/types";
import { formatCurrency, formatDate } from "@/modules/transactions/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [totals, setTotals] = useState<TransactionTotals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "type">("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const refresh = useCallback(() => {
    const token = getToken();
    if (!token) return;
    listTransactions(token, {
      search: search || undefined,
      type: type || undefined,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      sortBy,
      order,
      page,
    })
      .then((res) => {
        setTransactions(res.data);
        setTotalPages(res.pagination.totalPages || 1);
      })
      .catch((err) => setError(err.message));
    getTransactionTotals(token, {
      from: from || undefined,
      to: to || undefined,
    })
      .then(setTotals)
      .catch(() => setTotals(null));
  }, [search, type, status, from, to, sortBy, order, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Transactions
        </h1>
        <Link href="/transactions/new" className={buttonVariants()}>
          New transaction
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Number, category, reference"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tstatus">Status</Label>
          <select
            id="tstatus"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All</option>
            {TRANSACTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sortBy">Sort by</Label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "date" | "amount" | "type")
            }
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="type">Type</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="order">Order</Label>
          <select
            id="order"
            value={order}
            onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {totals ? (
        <p className="text-sm text-muted-foreground">
          {totals.count} transaction(s), total {formatCurrency(totals.totalAmount)}
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.transactionId}>
              <TableCell>{t.transactionNumber}</TableCell>
              <TableCell>{formatDate(t.transactionDate)}</TableCell>
              <TableCell>{t.transactionType}</TableCell>
              <TableCell>{t.category ?? "—"}</TableCell>
              <TableCell>{formatCurrency(t.amount)}</TableCell>
              <TableCell>{t.status}</TableCell>
              <TableCell>
                <Link
                  href={`/transactions/${t.transactionId}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
