"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import {
  deleteTransaction,
  getTransaction,
  updateTransactionStatus,
} from "@/modules/transactions/api";
import type { TransactionDto, TransactionStatus } from "@/modules/transactions/types";
import { TRANSACTION_STATUSES } from "@/modules/transactions/types";
import { formatCurrency, formatDate } from "@/modules/transactions/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const token = getToken();
    if (!token) return;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      setError("Invalid transaction id");
      return;
    }
    getTransaction(token, id)
      .then(setTransaction)
      .catch((err) => setError(err.message));
  }, [params.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleStatus(status: string) {
    const token = getToken();
    if (!token || !transaction) return;
    try {
      const updated = await updateTransactionStatus(
        token,
        transaction.transactionId,
        status as TransactionStatus,
      );
      setTransaction(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleDelete() {
    const token = getToken();
    if (!token || !transaction) return;
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(token, transaction.transactionId);
      router.push("/transactions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!transaction) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          {transaction.transactionNumber}
        </h1>
        <Link
          href={`/transactions/${transaction.transactionId}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Edit
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <dt className="text-muted-foreground">Date</dt>
        <dd>{formatDate(transaction.transactionDate)}</dd>
        <dt className="text-muted-foreground">Type</dt>
        <dd>{transaction.transactionType}</dd>
        <dt className="text-muted-foreground">Category</dt>
        <dd>{transaction.category ?? "—"}</dd>
        <dt className="text-muted-foreground">Amount</dt>
        <dd>{formatCurrency(transaction.amount)}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{transaction.status}</dd>
        <dt className="text-muted-foreground">Account ID</dt>
        <dd>{transaction.accountId}</dd>
        <dt className="text-muted-foreground">Reference</dt>
        <dd>{transaction.referenceNumber ?? "—"}</dd>
        <dt className="text-muted-foreground">Description</dt>
        <dd>{transaction.description ?? "—"}</dd>
        <dt className="text-muted-foreground">Created by</dt>
        <dd>User #{transaction.createdBy}</dd>
        <dt className="text-muted-foreground">Created at</dt>
        <dd>{formatDate(transaction.createdAt)}</dd>
      </dl>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Change status</span>
        <div className="flex gap-2">
          {TRANSACTION_STATUSES.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              disabled={transaction.status === s}
              onClick={() => handleStatus(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <Button variant="destructive" className="w-fit" onClick={handleDelete}>
        Delete transaction
      </Button>
    </div>
  );
}
