"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import {
  fetchAccountBalances,
  fetchAllVouchers,
  fetchVoucherPaymentTotals,
  getBudgetVsActualReport,
} from "@/modules/calculation/api";
import {
  computeFinancialTotals,
  formatCurrency,
  roundMoney,
  settlementSummary,
  toPeriodEnd,
  toPeriodStart,
} from "@/modules/calculation/utils";
import type {
  AccountBalanceRow,
  ExportTable,
  FinancialTotals,
} from "@/modules/calculation/types";
import { SummaryCard } from "@/modules/calculation/components/summary-card";
import { BarChart } from "@/modules/calculation/components/bar-chart";
import { EmptyState } from "@/modules/calculation/components/empty-state";
import { Notice } from "@/modules/calculation/components/notice";
import { ExportButtons } from "@/modules/calculation/components/export-buttons";
import { getTransactionTotals } from "@/modules/transactions/api";
import { listAccounts } from "@/modules/accounts/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BudgetSummary {
  approved: number;
  actual: number;
  remaining: number;
  overBudgetCount: number;
  rowCount: number;
}

export default function FinancialSummaryPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [totals, setTotals] = useState<FinancialTotals | null>(null);
  const [outstanding, setOutstanding] = useState(0);
  const [voucherCount, setVoucherCount] = useState(0);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [accountRows, setAccountRows] = useState<AccountBalanceRow[]>([]);

  const refresh = useCallback(() => {
    const token = getToken();
    if (!token) return;
    const period = { from: toPeriodStart(from), to: toPeriodEnd(to) };
    Promise.all([
      getTransactionTotals(token, period),
      fetchAllVouchers(token, period),
      getBudgetVsActualReport(token).catch(() => null),
      listAccounts(token),
      fetchVoucherPaymentTotals(token),
    ])
      .then(
        async ([
          transactionTotals,
          vouchers,
          budgets,
          accounts,
          paymentTotals,
        ]) => {
          setError(null);
          setTotals(computeFinancialTotals(transactionTotals));
          const paidByVoucher = new Map<number, number>();
          for (const row of paymentTotals) {
            paidByVoucher.set(row.voucherId, row.paidAmount);
          }
          const settled = settlementSummary(vouchers.rows, paidByVoucher);
          setOutstanding(settled.outstanding);
          setVoucherCount(vouchers.rows.length);
          if (budgets) {
            let approved = 0;
            let actual = 0;
            let overBudgetCount = 0;
            for (const row of budgets) {
              approved += Number(row.budgetAmount);
              actual += Number(row.actualExpenditure);
              if (Number(row.variance) < 0) overBudgetCount += 1;
            }
            setBudget({
              approved: roundMoney(approved),
              actual: roundMoney(actual),
              remaining: roundMoney(approved - actual),
              overBudgetCount,
              rowCount: budgets.length,
            });
          } else {
            setBudget(null);
          }
          const { rows, failedCount } = await fetchAccountBalances(
            token,
            accounts,
          );
          setAccountRows(rows);
          setAccountError(
            failedCount > 0
              ? "Some account balances could not be loaded."
              : null,
          );
        },
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const accountsExport: ExportTable = useMemo(
    () => ({
      headers: [
        "Account",
        "Type",
        "Status",
        "Opening balance",
        "Credits",
        "Debits",
        "Remaining balance",
      ],
      rows: accountRows.map((row) => [
        row.accountName,
        row.accountType,
        row.status,
        formatCurrency(row.openingBalance),
        formatCurrency(row.totalCredit),
        formatCurrency(row.totalDebit),
        formatCurrency(row.remainingBalance),
      ]),
    }),
    [accountRows],
  );

  const totalsRow = useMemo(
    () =>
      accountRows.reduce(
        (acc, row) => ({
          opening: acc.opening + row.openingBalance,
          credit: acc.credit + row.totalCredit,
          debit: acc.debit + row.totalDebit,
          remaining: acc.remaining + row.remainingBalance,
        }),
        { opening: 0, credit: 0, debit: 0, remaining: 0 },
      ),
    [accountRows],
  );

  const totalIncome = useMemo(
    () => roundMoney((totals?.income ?? 0) + totalsRow.opening),
    [totals, totalsRow.opening],
  );

  const netBalance = useMemo(
    () => roundMoney(totalIncome - (totals?.expenditure ?? 0)),
    [totalIncome, totals],
  );

  const summaryExport: ExportTable = useMemo(() => {
    const rows: string[][] = [
      ["Total income", formatCurrency(totalIncome)],
      [
        "Account opening balances (all accounts)",
        formatCurrency(totalsRow.opening),
      ],
      [
        "Income transactions (completed CREDIT + RECEIPT)",
        formatCurrency(totals?.income ?? 0),
      ],
      ["Total expenditure", formatCurrency(totals?.expenditure ?? 0)],
      ["Net balance", formatCurrency(netBalance)],
      ["Outstanding amount (vouchers)", formatCurrency(outstanding)],
      ["Approved budget (all budgets)", formatCurrency(budget?.approved ?? 0)],
      ["Budget actual expenditure", formatCurrency(budget?.actual ?? 0)],
      ["Remaining budget", formatCurrency(budget?.remaining ?? 0)],
      [
        "Other transaction amounts (TRANSFER/ADJUSTMENT)",
        formatCurrency(totals?.otherAmount ?? 0),
      ],
      ["Vouchers in period", String(voucherCount)],
    ];
    return { headers: ["Metric", "Value"], rows };
  }, [
    totals,
    outstanding,
    budget,
    voucherCount,
    totalIncome,
    netBalance,
    totalsRow.opening,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Financial Summary
        </h1>
        
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fs-from">Start date</Label>
            <Input
              id="fs-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fs-to">End date</Label>
            <Input
              id="fs-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          
        </div>
        <Link
          href="/transactions"
          className={buttonVariants({ size: "sm" })}
        >
          Back to transactions
        </Link>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total income"
          value={formatCurrency(totalIncome)}
          
        />
        <SummaryCard
          label="Total expenditure"
          value={formatCurrency(totals?.expenditure ?? 0)}
          
        />
        <SummaryCard
          label="Net balance"
          value={formatCurrency(netBalance)}
          
        />
        <SummaryCard
          label="Outstanding amount"
          value={formatCurrency(outstanding)}
          
        />
        <SummaryCard
          label="Approved budget"
          value={formatCurrency(budget?.approved ?? 0)}
          hint={
            budget
              ? `Across ${budget.rowCount} budget record(s); endpoint has no period filter`
              : "Budget report unavailable"
          }
        />
        <SummaryCard
          label="Remaining budget"
          value={formatCurrency(budget?.remaining ?? 0)}
          hint={
            budget && budget.remaining < 0
              ? `Over budget by ${formatCurrency(Math.abs(budget.remaining))} (${budget.overBudgetCount} line(s))`
              :"Approved budget − actual expenditure"
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-foreground">
          Income vs Expenditure
        </h2>
        <BarChart
          data={[
            { label: "Income", value: totalIncome },
            { label: "Expenditure", value: totals?.expenditure ?? 0 },
          ]}
          formatValue={formatCurrency}
          emptyMessage="No completed income or expenditure transactions exist for the selected period."
        />
        {totals && totals.otherCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {totals.otherCount} TRANSFER/ADJUSTMENT transaction(s) totalling{" "}
            {formatCurrency(totals.otherAmount)} are excluded from income and
            expenditure.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-foreground">
            Financial metrics
          </h2>
          <ExportButtons table={summaryExport} filename="financial-summary" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryExport.rows.map(([metric, value]) => (
              <TableRow key={metric}>
                <TableCell className="text-muted-foreground">
                  {metric}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-foreground">
            Account remaining balances
          </h2>
          <ExportButtons
            table={accountsExport}
            filename="account-remaining-balances"
          />
        </div>
        {accountError ? (
          <p className="text-sm text-destructive">{accountError}</p>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Opening balance</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Debits</TableHead>
              <TableHead>Remaining balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountRows.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState message="No accounts exist yet." />
                </TableCell>
              </TableRow>
            ) : (
              accountRows.map((row) => (
                <TableRow key={row.accountId}>
                  <TableCell className="font-medium text-foreground">
                    {row.accountName}
                  </TableCell>
                  <TableCell>{row.accountType}</TableCell>
                  <TableCell>{formatCurrency(row.openingBalance)}</TableCell>
                  <TableCell>{formatCurrency(row.totalCredit)}</TableCell>
                  <TableCell>{formatCurrency(row.totalDebit)}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {formatCurrency(row.remainingBalance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {accountRows.length > 0 ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>{formatCurrency(totalsRow.opening)}</TableCell>
                <TableCell>{formatCurrency(totalsRow.credit)}</TableCell>
                <TableCell>{formatCurrency(totalsRow.debit)}</TableCell>
                <TableCell>{formatCurrency(totalsRow.remaining)}</TableCell>
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
        
      </section>

      
    </div>
  );
}
