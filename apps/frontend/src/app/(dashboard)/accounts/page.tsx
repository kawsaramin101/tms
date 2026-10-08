"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { createAccount, listAccounts } from "@/modules/accounts/api";
import type { AccountDto } from "@/modules/accounts/types";
import { formatCurrency } from "@/modules/transactions/utils";
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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("CASH");
  const [accountNumber, setAccountNumber] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");

  const refresh = useCallback(() => {
    const token = getToken();
    if (!token) return;
    listAccounts(token)
      .then(setAccounts)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) return;
    try {
      await createAccount(token, {
        accountName,
        accountType,
        accountNumber: accountNumber || undefined,
        openingBalance: Number(openingBalance) || 0,
      });
      setAccountName("");
      setAccountType("CASH");
      setAccountNumber("");
      setOpeningBalance("0");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        Accounts
      </h1>

      <form onSubmit={handleCreate} className="flex max-w-xl flex-col gap-4">
        <h2 className="text-lg font-medium text-foreground">Create account</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="accountName">Name</Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="accountType">Type</Label>
            <Input
              id="accountType"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="accountNumber">Account number</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="openingBalance">Opening balance</Label>
            <Input
              id="openingBalance"
              type="number"
              min="0"
              step="10"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" className="w-fit">
          Create account
        </Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Account #</TableHead>
            <TableHead>Opening balance</TableHead>
            <TableHead>Current balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((a) => (
            <TableRow key={a.accountId}>
              <TableCell>{a.accountName}</TableCell>
              <TableCell>{a.accountType}</TableCell>
              <TableCell>{a.accountNumber ?? "—"}</TableCell>
              <TableCell>{formatCurrency(a.openingBalance)}</TableCell>
              <TableCell>{formatCurrency(a.currentBalance)}</TableCell>
              <TableCell>{a.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
