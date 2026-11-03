import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { HttpError } from "./error.middleware.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "vouchers");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const VOUCHER_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(
      new HttpError(
        400,
        "Only JPG, PNG, and WEBP images are allowed for voucher photos",
      ),
    );
    return;
  }
  cb(null, true);
}

export const voucherPhotoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: VOUCHER_PHOTO_MAX_BYTES, files: 10 },
});

export function uploadsDir(): string {
  return UPLOAD_DIR;
}
