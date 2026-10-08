"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { createTransaction } from "@/modules/transactions/api";
import { listAccounts } from "@/modules/accounts/api";
import type { AccountDto } from "@/modules/accounts/types";
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  type TransactionStatus,
  type TransactionType,
} from "@/modules/transactions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewTransactionPage() {
  const router = useRouter();
  const [accountId, setAccountId] = useState("");
  const [transactionType, setTransactionType] =
    useState<TransactionType>("CREDIT");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [status, setStatus] = useState<TransactionStatus>("COMPLETED");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    listAccounts(token)
      .then(setAccounts)
      .catch(() => setAccounts([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) {
      setError("You must be logged in");
      return;
    }
    const parsedAccountId = Number(accountId);
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAccountId) || parsedAccountId <= 0) {
      setError("A valid account ID is required");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createTransaction(token, {
        accountId: parsedAccountId,
        transactionType,
        category: category || undefined,
        amount: parsedAmount,
        description: description || undefined,
        referenceNumber: referenceNumber || undefined,
        transactionDate: transactionDate
          ? new Date(transactionDate).toISOString()
          : undefined,
        status,
      });
      router.push(`/transactions/${created.transactionId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create transaction",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        New Transaction
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="accountId">Account</Label>
          <select
            id="accountId"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            <option value="">Select an account</option>
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.accountName} ({a.accountType})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as TransactionType)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {TRANSACTION_TYPES.map((t) => (
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
            step="10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
          <Label htmlFor="referenceNumber">Reference number</Label>
          <Input
            id="referenceNumber"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="transactionDate">Date</Label>
          <Input
            id="transactionDate"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TransactionStatus)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {TRANSACTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-fit" disabled={submitting}>
          {submitting ? "Creating..." : "Create transaction"}
        </Button>
      </form>
    </div>
  );
}
