"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { createVoucher } from "@/modules/vouchers/api";
import {
  VOUCHER_STATUSES,
  VOUCHER_TYPES,
  type VoucherStatus,
  type VoucherType,
} from "@/modules/vouchers/types";
import {
  listTransactions,
} from "@/modules/transactions/api";
import type { TransactionDto } from "@/modules/transactions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewVoucherPage() {
  const router = useRouter();
  const [transactionNumber, setTransactionNumber] = useState("");
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [voucherType, setVoucherType] = useState<VoucherType>("PAYMENT");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<VoucherStatus>("PENDING");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    listTransactions(token, { limit: 50 })
      .then((res) => {
        setTransactions(res.data);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) {
      setError("You must be logged in");
      return;
    }
    const parsedAmount = Number(amount);
    if (!transactionNumber.trim()) {
      setError("Select a transaction");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createVoucher(token, {
        transactionNumber: transactionNumber.trim(),
        voucherType,
        amount: parsedAmount,
        description: description || undefined,
        status,
      });
      router.push(`/vouchers/${created.voucherId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create voucher");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        New Voucher
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="transaction">Transaction</Label>
          <select
            id="transaction"
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            <option value="">Select a transaction</option>
            {transactions.map((t) => (
              <option key={t.transactionId} value={t.transactionNumber}>
                {t.transactionNumber} — {t.transactionType} ({t.status})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={voucherType}
            onChange={(e) => setVoucherType(e.target.value as VoucherType)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {VOUCHER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as VoucherStatus)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {VOUCHER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-fit" disabled={submitting}>
          {submitting ? "Creating..." : "Create voucher"}
        </Button>
      </form>
    </div>
  );
}
