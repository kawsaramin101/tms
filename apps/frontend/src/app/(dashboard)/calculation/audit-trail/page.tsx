"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { fetchAuditLogs } from "@/modules/calculation/api";
import {
  VOUCHER_AUDIT_ACTION_OPTIONS,
  type AuditLogDto,
} from "@/modules/calculation/types";
import {
  auditActionLabel,
  auditCategory,
  auditTableLabel,
  formatDateTime,
} from "@/modules/calculation/utils";
import { TrackingTabs } from "@/modules/calculation/components/tracking-tabs";
import { EmptyState } from "@/modules/calculation/components/empty-state";
import { Notice } from "@/modules/calculation/components/notice";
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

const PAGE_SIZE = 15;

export default function AuditTrailPage() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recordId, setRecordId] = useState("");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const canView =
    user === null || user.role === "ADMIN" || user.role === "TREASURER";

  const refresh = useCallback(() => {
    const token = getToken();
    if (!token || !canView) return;
    fetchAuditLogs(token, {
      tableName: "vouchers",
      recordId: recordId ? Number(recordId) : undefined,
      userId: userId ? Number(userId) : undefined,
      action: action || undefined,
      from: from ? `${from}T00:00:00.000` : undefined,
      to: to ? `${to}T23:59:59.999` : undefined,
      page,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        setLogs(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages || 1);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [recordId, userId, action, from, to, page, canView]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  function clearFilters() {
    setRecordId("");
    setUserId("");
    setAction("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  if (authLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!canView) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <TrackingTabs />
        <Notice tone="warning">
          Your account role does not have permission to view audit history.
          Audit data is restricted to administrators and treasurers on the
          backend, and this page will not bypass that rule.
        </Notice>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />
      <TrackingTabs />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="audit-record-id">Voucher ID</Label>
          <Input
            id="audit-record-id"
            type="number"
            min="1"
            value={recordId}
            onChange={(e) => {
              setRecordId(e.target.value);
              setPage(1);
            }}
            placeholder="Any voucher"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="audit-user-id">User ID</Label>
          <Input
            id="audit-user-id"
            type="number"
            min="1"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setPage(1);
            }}
            placeholder="Actor user ID"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="audit-action">Action type</Label>
          <select
            id="audit-action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All</option>
            {VOUCHER_AUDIT_ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="audit-from">Start date</Label>
          <Input
            id="audit-from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="audit-to">End date</Label>
          <Input
            id="audit-to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
        <span className="text-sm text-muted-foreground">
          {total} voucher audit record{total === 1 ? "" : "s"} found
        </span>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : null}
<Notice>
        This page shows voucher-related audit history only . It is read-only; entries are written by the existing backend
        services and are never modified from this page. 
      </Notice>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date &amp; time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Affected record</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={5}>
                <EmptyState message="No voucher audit records match the selected filters." />
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.logId}>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </TableCell>
                <TableCell>
                  <span className="block font-medium text-foreground">
                    {log.userName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {log.userEmail ?? `User #${log.userId}`}
                  </span>
                </TableCell>
                <TableCell>{auditCategory(log.action, log.tableName)}</TableCell>
                <TableCell>
                  <span className="block text-foreground">
                    {auditActionLabel(
                      log.action,
                      log.tableName,
                      log.description,
                    )}
                  </span>
                  {log.description ? (
                    <span className="block text-xs text-muted-foreground">
                      {log.description}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {auditTableLabel(log.tableName)}
                  {log.recordId !== null ? ` #${log.recordId}` : ""}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 ? (
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
      ) : null}
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-1">
      
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        Audit Trail
      </h1>
      
    </div>
  );
}
