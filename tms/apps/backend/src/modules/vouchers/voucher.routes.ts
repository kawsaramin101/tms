import { Router } from "express";
import * as voucherController from "./voucher.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { voucherPhotoUpload } from "../../middleware/upload.middleware.js";

const router = Router();

router.get("/", authenticate, voucherController.list);
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  voucherController.create,
);

router.get("/:id", authenticate, voucherController.getById);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  voucherController.update,
);
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  voucherController.updateStatus,
);
router.patch(
  "/:id/link",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  voucherController.link,
);
router.delete("/:id", authenticate, authorize("ADMIN"), voucherController.remove);

router.post(
  "/:id/photos",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  voucherPhotoUpload.array("photos", 10),
  voucherController.uploadPhotos,
);
router.get("/:id/photos/:photoId", authenticate, voucherController.viewPhoto);
router.get(
  "/:id/photos/:photoId/download",
  authenticate,
  voucherController.downloadPhoto,
);
router.put(
  "/:id/photos/:photoId",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  voucherPhotoUpload.single("photo"),
  voucherController.replace,
);
router.delete(
  "/:id/photos/:photoId",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  voucherController.removePhoto,
);

export default router;
