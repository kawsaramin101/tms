"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import {
  deleteVoucher,
  deleteVoucherPhoto,
  downloadVoucherPhoto,
  fetchVoucherPhotoBlob,
  getVoucher,
  linkVoucherTransaction,
  replaceVoucherPhoto,
  updateVoucherStatus,
  uploadVoucherPhotos,
} from "@/modules/vouchers/api";
import { listTransactions } from "@/modules/transactions/api";
import type { TransactionDto } from "@/modules/transactions/types";
import type { VoucherDto, VoucherStatus } from "@/modules/vouchers/types";
import { VOUCHER_STATUSES } from "@/modules/vouchers/types";
import {
  formatCurrency,
  formatDate,
  formatFileSize,
} from "@/modules/vouchers/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const voucherId = Number(id);
  const [voucher, setVoucher] = useState<VoucherDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newStatus, setNewStatus] = useState<VoucherStatus>("PENDING");
  const [linkNumber, setLinkNumber] = useState("");
  const [linkOptions, setLinkOptions] = useState<TransactionDto[]>([]);
  const [viewerPhotoId, setViewerPhotoId] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewUrlsRef = useRef<Record<number, string>>({});
  previewUrlsRef.current = previewUrls;

  useEffect(() => {
    const ref = previewUrlsRef;
    return () => {
      for (const url of Object.values(ref.current)) URL.revokeObjectURL(url);
    };
  }, []);

  const refresh = useCallback(() => {
    const token = getToken();
    if (!token || !Number.isInteger(voucherId)) return;
    getVoucher(token, voucherId)
      .then((v) => {
        setVoucher(v);
        setNewStatus(v.status as VoucherStatus);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [voucherId]);

  useEffect(() => {
    refresh();
    const token = getToken();
    if (!token) return;
    listTransactions(token, { limit: 50 })
      .then((res) => setLinkOptions(res.data))
      .catch(() => setLinkOptions([]));
  }, [refresh]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    const token = getToken();
    if (!token) {
      setError("You must be logged in");
      return;
    }
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      await uploadVoucherPhotos(token, voucherId, files);
      setNotice(`Uploaded ${files.length} photo(s)`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleReplace(photoId: number, file: File | undefined) {
    if (!file) return;
    const token = getToken();
    if (!token) return;
    setError(null);
    setNotice(null);
    try {
      await replaceVoucherPhoto(token, voucherId, photoId, file);
      setNotice("Photo replaced");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Replace failed");
    }
  }

  async function handleView(photoId: number) {
    if (viewerPhotoId === photoId) {
      setViewerPhotoId(null);
      return;
    }
    const token = getToken();
    if (!token) {
      setError("You must be logged in");
      return;
    }
    setViewerPhotoId(photoId);
    if (previewUrls[photoId]) return;
    setPreviewError(null);
    try {
      const blob = await fetchVoucherPhotoBlob(token, voucherId, photoId);
      const url = URL.createObjectURL(blob);
      setPreviewUrls((prev) => ({ ...prev, [photoId]: url }));
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "View failed");
    }
  }

  async function handleDownload(photoId: number, fileName: string) {
    const token = getToken();
    if (!token) {
      setError("You must be logged in");
      return;
    }
    setError(null);
    try {
      await downloadVoucherPhoto(token, voucherId, photoId, fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

  async function handleDeletePhoto(photoId: number) {
    const token = getToken();
    if (!token) return;
    setError(null);
    setNotice(null);
    try {
      await deleteVoucherPhoto(token, voucherId, photoId);
      setNotice("Photo deleted");
      if (viewerPhotoId === photoId) setViewerPhotoId(null);
      setPreviewUrls((prev) => {
        const url = prev[photoId];
        if (url) URL.revokeObjectURL(url);
        const next = { ...prev };
        delete next[photoId];
        return next;
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleStatusUpdate() {
    const token = getToken();
    if (!token) return;
    setError(null);
    setNotice(null);
    try {
      const updated = await updateVoucherStatus(token, voucherId, newStatus);
      setVoucher(updated);
      setNotice(`Status updated to ${updated.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function handleLink() {
    const token = getToken();
    if (!token) return;
    const trimmed = linkNumber.trim();
    if (!trimmed) {
      setError("Select a transaction to link");
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const updated = await linkVoucherTransaction(token, voucherId, trimmed);
      setVoucher(updated);
      setNotice(`Linked to transaction ${updated.transactionNumber}`);
      setLinkNumber("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link failed");
    }
  }

  async function handleDeleteVoucher() {
    const token = getToken();
    if (!token) return;
    if (!window.confirm("Delete this voucher and all its photos?")) return;
    try {
      await deleteVoucher(token, voucherId);
      window.location.href = "/vouchers";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (!voucher) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Voucher
        </h1>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          {voucher.voucherNumber}
        </h1>
        <Link href="/vouchers" className={buttonVariants({ variant: "ghost" })}>
          Back to vouchers
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Type</dt>
          <dd>{voucher.voucherType}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd>{formatCurrency(voucher.amount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd>{voucher.status}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Transaction</dt>
          <dd>{voucher.transactionNumber}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Description</dt>
          <dd>{voucher.description ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatDate(voucher.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Photos</dt>
          <dd>{voucher.photoCount}</dd>
        </div>
      </dl>

      {notice ? <p className="text-sm text-foreground">{notice}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Photos</h2>
        <Label htmlFor="photo-upload">
          Upload photos (JPG, PNG, WEBP — max 5MB each)
        </Label>
        <Input
          id="photo-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleUpload}
          disabled={uploading}
        />
        {uploading ? (
          <p className="text-sm text-muted-foreground">Uploading...</p>
        ) : null}
        <ul className="flex flex-col gap-3">
          {voucher.photos.map((p) => (
            <li
              key={p.photoId}
              className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{p.fileName}</span>
                <span className="text-muted-foreground">
                  {formatFileSize(p.fileSize)}
                </span>
              </div>
              <p className="text-muted-foreground">
                Uploaded by {p.uploaderName ?? `user ${p.uploadedBy}`} on{" "}
                {formatDate(p.createdAt)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(p.photoId)}
                >
                  {viewerPhotoId === p.photoId ? "Hide" : "View"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(p.photoId, p.fileName)}
                >
                  Download
                </Button>
                <Label
                  htmlFor={`replace-${p.photoId}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Replace
                </Label>
                <Input
                  id={`replace-${p.photoId}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleReplace(p.photoId, e.target.files?.[0])}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePhoto(p.photoId)}
                >
                  Delete
                </Button>
              </div>
              {viewerPhotoId === p.photoId ? (
                previewUrls[p.photoId] ? (
                  <img
                    src={previewUrls[p.photoId]}
                    alt={p.fileName}
                    className="max-h-96 w-auto rounded-md border border-border object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {previewError ?? "Loading preview..."}
                  </p>
                )
              ) : null}
            </li>
          ))}
        </ul>
        {voucher.photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No photos uploaded yet.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Status</h2>
        <div className="flex items-center gap-2">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as VoucherStatus)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {VOUCHER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleStatusUpdate}>
            Update status
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Link transaction</h2>
        <div className="flex items-center gap-2">
          <select
            value={linkNumber}
            onChange={(e) => setLinkNumber(e.target.value)}
            className="h-9 max-w-64 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select a transaction</option>
            {linkOptions.map((t) => (
              <option key={t.transactionId} value={t.transactionNumber}>
                {t.transactionNumber} — {t.transactionType} ({t.status})
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleLink}>
            Link
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <Button variant="destructive" size="sm" onClick={handleDeleteVoucher}>
          Delete voucher
        </Button>
      </div>
    </div>
  );
}
