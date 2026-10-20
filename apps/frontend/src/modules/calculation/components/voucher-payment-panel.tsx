"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import type { AccountDto } from "@/modules/accounts/types";
import type { VoucherDto } from "@/modules/vouchers/types";
import type {
  CreateVoucherPaymentRequest,
  VoucherPaymentSummaryDto,
} from "@/modules/calculation/types";
import {
  createVoucherPayment,
  getVoucherPayments,
  reverseVoucherPayment,
} from "@/modules/calculation/api";
import { formatCurrency, formatDateTime } from "@/modules/calculation/utils";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
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

interface VoucherPaymentPanelProps {
  voucher: VoucherDto;
  accounts: AccountDto[];
  onChanged: () => void;
}

export function VoucherPaymentPanel({
  voucher,
  accounts,
  onChanged,
}: VoucherPaymentPanelProps) {
  const [summary, setSummary] = useState<VoucherPaymentSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reversingId, setReversingId] = useState<number | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let active = true;
    getVoucherPayments(token, voucher.voucherId)
      .then((data) => {
        if (!active) return;
        setSummary(data);
        setError(null);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load payments",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [voucher.voucherId]);

  const outstanding = summary?.outstandingAmount ?? Number(voucher.amount);
  const cancelled =
    voucher.status === "CANCELLED" || summary?.paymentStatus === "Cancelled";
  const rejected = voucher.status === "REJECTED";
  const canPay = !cancelled && !rejected && outstanding > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setError("You must be logged in");
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Payment amount must be greater than 0");
      return;
    }
    if (parsedAmount > outstanding + 0.001) {
      setError(
        `Payment exceeds the outstanding balance of ${formatCurrency(outstanding)}`,
      );
      return;
    }
    if (!accountId) {
      setError("Select the account the payment is made from");
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await createVoucherPayment(token, voucher.voucherId, {
        accountId: Number(accountId),
        amount: parsedAmount,
        ...(transactionDate
          ? { transactionDate: new Date(`${transactionDate}T00:00:00`).toISOString() }
          : {}),
        ...(referenceNumber.trim()
          ? { referenceNumber: referenceNumber.trim() }
          : {}),
      } satisfies CreateVoucherPaymentRequest);
      setSummary(updated);
      setAmount("");
      setReferenceNumber("");
      setNotice(
        `Payment of ${formatCurrency(parsedAmount)} recorded. Outstanding is now ${formatCurrency(updated.outstandingAmount)}.`,
      );
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReverse(transactionId: number, label: string) {
    if (
      !window.confirm(
        `Reverse payment ${label}? The transaction is kept for history and marked CANCELLED.`,
      )
    ) {
      return;
    }
    const token = getToken();
    if (!token) return;
    setReversingId(transactionId);
    setError(null);
    setNotice(null);
    try {
      const updated = await reverseVoucherPayment(
        token,
        voucher.voucherId,
        transactionId,
      );
      setSummary(updated);
      setNotice(
        `Payment reversed. Outstanding is now ${formatCurrency(updated.outstandingAmount)}.`,
      );
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reversal failed");
    } finally {
      setReversingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-muted/20 p-4">
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Voucher amount</p>
          <p className="font-medium text-foreground">
            {formatCurrency(Number(voucher.amount))}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Total paid</p>
          <p className="font-medium text-foreground">
            {formatCurrency(summary?.paidAmount ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Outstanding</p>
          <p className="font-medium text-foreground">
            {formatCurrency(outstanding)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Payment status</p>
          <StatusBadge value={summary?.paymentStatus ?? "Unpaid"} />
        </div>
      </div>

      {notice ? <p className="text-sm text-foreground">{notice}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading payments...</p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Recorded by</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary && summary.payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <EmptyState message="No payments recorded for this voucher yet." />
              </TableCell>
            </TableRow>
          ) : (
            (summary?.payments ?? []).map((payment) => (
              <TableRow key={payment.transactionId}>
                <TableCell>{payment.transactionNumber}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{formatDateTime(payment.transactionDate)}</TableCell>
                <TableCell>{payment.transactionType}</TableCell>
                <TableCell>
                  <StatusBadge value={payment.status} />
                </TableCell>
                <TableCell>{payment.referenceNumber ?? "—"}</TableCell>
                <TableCell>
                  {payment.creatorName ?? `user ${payment.createdBy}`}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="text-sm text-destructive underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                    disabled={
                      payment.status === "CANCELLED" ||
                      reversingId === payment.transactionId
                    }
                    onClick={() =>
                      handleReverse(
                        payment.transactionId,
                        payment.transactionNumber,
                      )
                    }
                  >
                    {payment.status === "CANCELLED"
                      ? "Reversed"
                      : reversingId === payment.transactionId
                        ? "Reversing..."
                        : "Reverse"}
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {canPay ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 border-t border-border pt-4"
        >
          <p className="text-sm text-muted-foreground">
            Outstanding amount: {formatCurrency(outstanding)}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`pay-account-${voucher.voucherId}`}>Account</Label>
              <select
                id={`pay-account-${voucher.voucherId}`}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.accountName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`pay-amount-${voucher.voucherId}`}>
                Amount
              </Label>
              <Input
                id={`pay-amount-${voucher.voucherId}`}
                type="number"
                step="0.01"
                min="0.01"
                max={outstanding}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`pay-date-${voucher.voucherId}`}>Date</Label>
              <Input
                id={`pay-date-${voucher.voucherId}`}
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`pay-ref-${voucher.voucherId}`}>
                Reference
              </Label>
              <Input
                id={`pay-ref-${voucher.voucherId}`}
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Recording..." : "Record payment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          {cancelled
            ? "This voucher is cancelled; payments cannot be recorded."
            : rejected
              ? "This voucher was rejected; payments cannot be recorded."
              : "This voucher is fully settled; no further payments are allowed."}
        </p>
      )}
    </div>
  );
}
