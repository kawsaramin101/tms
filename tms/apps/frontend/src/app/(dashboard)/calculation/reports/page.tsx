"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth";
import {
  fetchAllTransactions,
  fetchAllVouchers,
  fetchVoucherPaymentTotals,
  getFinancialReconciliationReport,
} from "@/modules/calculation/api";
import type {
  ExportTable,
  ReportSectionKey,
  VoucherPaymentTotalsDto,
} from "@/modules/calculation/types";
import {
  buildReconciliationRows,
  formatCurrency,
  isOutstandingVoucher,
  settlementSummary,
  toPeriodEnd,
  toPeriodStart,
} from "@/modules/calculation/utils";
import { TrackingTabs } from "@/modules/calculation/components/tracking-tabs";
import { SummaryCard } from "@/modules/calculation/components/summary-card";
import { StatusBadge } from "@/modules/calculation/components/status-badge";
import { EmptyState } from "@/modules/calculation/components/empty-state";
import { Notice } from "@/modules/calculation/components/notice";
import { ExportButtons } from "@/modules/calculation/components/export-buttons";
import { VoucherPaymentPanel } from "@/modules/calculation/components/voucher-payment-panel";
import { listAccounts } from "@/modules/accounts/api";
import type { AccountDto } from "@/modules/accounts/types";
import type { VoucherDto } from "@/modules/vouchers/types";
import type { TransactionDto } from "@/modules/transactions/types";
import type { FinancialReconciliationReport } from "@tms/contracts";
import { VOUCHER_STATUSES } from "@/modules/vouchers/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SECTIONS: Array<{ key: ReportSectionKey; label: string }> = [
  { key: "outstanding", label: "A. Outstanding & Overdue" },
  { key: "reconciliation", label: "B. Transaction Reconciliation" },
];

export default function TrackingDashboardPage() {
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [voucherTruncated, setVoucherTruncated] = useState(false);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [transactionTruncated, setTransactionTruncated] = useState(false);
  const [reconStats, setReconStats] =
    useState<FinancialReconciliationReport | null>(null);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [paymentTotals, setPaymentTotals] = useState<
    Map<number, VoucherPaymentTotalsDto>
  >(new Map());
  const [expandedVoucherId, setExpandedVoucherId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [section, setSection] = useState<ReportSectionKey>("outstanding");

  const loadPaymentTotals = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetchVoucherPaymentTotals(token)
      .then((rows) => {
        setPaymentTotals(new Map(rows.map((row) => [row.voucherId, row])));
      })
      .catch(() => setPaymentTotals(new Map()));
  }, []);

  const refresh = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetchAllVouchers(token, {
      type: type || undefined,
      status: approvalStatus || undefined,
      from: toPeriodStart(from),
      to: toPeriodEnd(to),
    })
      .then((res) => {
        setVouchers(res.rows);
        setVoucherTruncated(res.truncated);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type, approvalStatus, from, to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchAllTransactions(token)
      .then((res) => {
        setTransactions(res.rows);
        setTransactionTruncated(res.truncated);
      })
      .catch(() => setTransactions([]));
    getFinancialReconciliationReport(token)
      .then(setReconStats)
      .catch(() => setReconStats(null));
    listAccounts(token)
      .then(setAccounts)
      .catch(() => setAccounts([]));
    loadPaymentTotals();
  }, [loadPaymentTotals]);

  const paidByVoucher = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of paymentTotals.values()) {
      map.set(row.voucherId, row.paidAmount);
    }
    return map;
  }, [paymentTotals]);

  const summary = useMemo(() => {
    const gross = vouchers.reduce(
      (sum, v) => sum + Number(v.amount),
      0,
    );
    const settled = settlementSummary(vouchers, paidByVoucher);
    const pending = vouchers.filter((v) => v.status === "PENDING").length;
    const pendingAmount = vouchers
      .filter((v) => v.status === "PENDING")
      .reduce((sum, v) => sum + Number(v.amount), 0);
    return {
      gross: Math.round((gross + Number.EPSILON) * 100) / 100,
      pending,
      pendingAmount:
        Math.round((pendingAmount + Number.EPSILON) * 100) / 100,
      outstanding: settled.outstanding,
    };
  }, [vouchers, paidByVoucher]);

  const outstandingRows = useMemo(
    () => vouchers.filter(isOutstandingVoucher),
    [vouchers],
  );

  const reconciliation = useMemo(
    () => buildReconciliationRows(vouchers, transactions),
    [vouchers, transactions],
  );
  const reconciliationCounts = useMemo(() => {
    const counts = { Matched: 0, Unmatched: 0, "Amount Mismatch": 0 };
    for (const row of reconciliation) {
      counts[row.status] += 1;
    }
    return counts;
  }, [reconciliation]);

  const exportTable: ExportTable = useMemo(() => {
    if (section === "outstanding") {
      return {
        headers: [
          "Voucher number",
          "Type",
          "Amount",
          "Settled",
          "Outstanding",
          "Payment status",
          "Approval status",
          "Due date",
          "Overdue",
        ],
        rows: outstandingRows.map((v) => {
          const amount = Number(v.amount);
          const paid = Math.min(paidByVoucher.get(v.voucherId) ?? 0, amount);
          return [
            v.voucherNumber,
            v.voucherType,
            formatCurrency(amount),
            formatCurrency(paid),
            formatCurrency(amount - paid),
            paymentTotals.get(v.voucherId)?.paymentStatus ?? "Unpaid",
            v.status,
            "Not stored",
            "Cannot determine",
          ];
        }),
      };
    }
    if (section === "reconciliation") {
      return {
        headers: [
          "Result",
          "Voucher number",
          "Transaction number",
          "Expected amount",
          "Actual amount",
          "Difference",
        ],
        rows: reconciliation.map((row) => [
          row.status,
          row.voucherNumber ?? "—",
          row.transactionNumber ?? "—",
          row.expectedAmount === null
            ? "—"
            : formatCurrency(row.expectedAmount),
          row.actualAmount === null ? "—" : formatCurrency(row.actualAmount),
          row.difference === null ? "—" : formatCurrency(row.difference),
        ]),
      };
    }
    return { headers: [], rows: [] };
  }, [section, outstandingRows, reconciliation, paidByVoucher, paymentTotals]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Voucher Tracking Dashboard
        </h1>
        
      </div>

      <TrackingTabs />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dash-from">Start date</Label>
          <Input
            id="dash-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dash-to">End date</Label>
          <Input
            id="dash-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dash-type">Voucher type</Label>
          <select
            id="dash-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All</option>
            <option value="PAYMENT">Payment</option>
            <option value="RECEIPT">Receipt</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dash-approval">Approval status</Label>
          <select
            id="dash-approval"
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
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
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard label="Total Vouchers" value={String(vouchers.length)} />
        <SummaryCard
          label="Total Voucher Amount"
          value={formatCurrency(summary.gross)}
        />
        <SummaryCard
          label="Pending Approval"
          value={String(summary.pending)}
         
        />
        <SummaryCard
          label="Outstanding Balance"
          value={formatCurrency(summary.outstanding)}
          
        />
      </div>

      {voucherTruncated ? (
        <Notice tone="warning">
          The voucher list was truncated at the backend pagination cap, so
          figures are computed from the loaded records only.
        </Notice>
      ) : null}

      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted/40 p-1">
        {SECTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSection(item.key)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm transition-colors",
              section === item.key
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "outstanding" ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-foreground">
              Outstanding &amp; Overdue Report
            </h2>
            <ExportButtons
              table={exportTable}
              filename="outstanding-overdue-report"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Settled</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Payment status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Payments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstandingRows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <EmptyState message="No outstanding vouchers match the selected filters." />
                  </TableCell>
                </TableRow>
              ) : (
                outstandingRows.map((v) => {
                  const amount = Number(v.amount);
                  const paid = Math.min(
                    paidByVoucher.get(v.voucherId) ?? 0,
                    amount,
                  );
                  const totals = paymentTotals.get(v.voucherId);
                  const isExpanded = expandedVoucherId === v.voucherId;
                  return (
                    <Fragment key={v.voucherId}>
                      <TableRow>
                        <TableCell>{v.voucherNumber}</TableCell>
                        <TableCell>{v.voucherType}</TableCell>
                        <TableCell>{formatCurrency(amount)}</TableCell>
                        <TableCell>{formatCurrency(paid)}</TableCell>
                        <TableCell>{formatCurrency(amount - paid)}</TableCell>
                        <TableCell>
                          <StatusBadge
                            value={totals?.paymentStatus ?? "Unpaid"}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={v.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          Not stored
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          Cannot determine
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpandedVoucherId(isExpanded ? null : v.voucherId)
                            }
                          >
                            {isExpanded ? "Hide" : "Payments"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow>
                          <TableCell colSpan={10} className="bg-muted/30">
                            <VoucherPaymentPanel
                              voucher={v}
                              accounts={accounts}
                              onChanged={loadPaymentTotals}
                            />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </section>
      ) : null}

      {section === "reconciliation" ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-foreground">
              Transaction Reconciliation Report
            </h2>
            <ExportButtons
              table={exportTable}
              filename="transaction-reconciliation-report"
            />
          </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryCard
              label="Matched"
              value={String(reconciliationCounts["Matched"])}
            />
            <SummaryCard
              label="Unmatched"
              value={String(reconciliationCounts["Unmatched"])}
            />
            <SummaryCard
              label="Amount Mismatch"
              value={String(reconciliationCounts["Amount Mismatch"])}
            />
            <SummaryCard
              label="Completed transactions"
              value={String(reconStats?.completedTransactions ?? 0)}
            />
            <SummaryCard
              label="Pending amount"
              value={formatCurrency(summary.pendingAmount)}
             
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Result</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Expected amount</TableHead>
                <TableHead>Actual amount</TableHead>
                <TableHead>Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliation.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState message="No vouchers or transactions match the selected filters." />
                  </TableCell>
                </TableRow>
              ) : (
                reconciliation.map((row, index) => (
                  <TableRow key={`${row.voucherNumber ?? ""}-${row.transactionNumber ?? ""}-${index}`}>
                    <TableCell>
                      <StatusBadge value={row.status} />
                    </TableCell>
                    <TableCell>{row.voucherNumber ?? "—"}</TableCell>
                    <TableCell>{row.transactionNumber ?? "—"}</TableCell>
                    <TableCell>
                      {row.expectedAmount === null
                        ? "—"
                        : formatCurrency(row.expectedAmount)}
                    </TableCell>
                    <TableCell>
                      {row.actualAmount === null
                        ? "—"
                        : formatCurrency(row.actualAmount)}
                    </TableCell>
                    <TableCell>
                      {row.difference === null
                        ? "—"
                        : formatCurrency(row.difference)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Notice>
            {transactionTruncated || voucherTruncated
              ? " Some records were truncated by the pagination cap, which can affect results."
              : ""}
          </Notice>
        </section>
      ) : null}
    </div>
  );
}
