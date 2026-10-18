"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { listVouchers } from "@/modules/vouchers/api";
import type { VoucherDto } from "@/modules/vouchers/types";
import {
  VOUCHER_STATUSES,
  VOUCHER_TYPES,
} from "@/modules/vouchers/types";
import { formatCurrency, formatDate } from "@/modules/vouchers/utils";
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

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const refresh = useCallback(() => {
    const token = getToken();
    if (!token) return;
    listVouchers(token, {
      search: search || undefined,
      type: type || undefined,
      status: status || undefined,
      page,
    })
      .then((res) => {
        setVouchers(res.data);
        setTotalPages(res.pagination.totalPages || 1);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [search, type, status, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Vouchers
        </h1>
        <Link href="/vouchers/new" className={buttonVariants()}>
          New voucher
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
            placeholder="Number or description"
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
            {VOUCHER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="vstatus">Status</Label>
          <select
            id="vstatus"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All</option>
            {VOUCHER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Photos</TableHead>
            <TableHead>Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vouchers.map((v) => (
            <TableRow key={v.voucherId}>
              <TableCell>{v.voucherNumber}</TableCell>
              <TableCell>{v.voucherType}</TableCell>
              <TableCell>{v.transactionNumber}</TableCell>
              <TableCell>{formatCurrency(v.amount)}</TableCell>
              <TableCell>{v.status}</TableCell>
              <TableCell>{v.photoCount}</TableCell>
              <TableCell>{formatDate(v.createdAt)}</TableCell>
              <TableCell>
                <Link
                  href={`/vouchers/${v.voucherId}`}
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
