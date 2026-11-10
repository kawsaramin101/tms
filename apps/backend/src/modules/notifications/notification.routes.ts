import { Router } from "express";
import * as notificationController from "./notification.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

// Order matters: specific subpaths before parameterised /:id routes
router.get("/unread-count", authenticate, notificationController.getUnreadCount);
router.get("/stats", authenticate, notificationController.getStats);
router.get("/preferences", authenticate, notificationController.getPreferences);
router.put("/preferences", authenticate, notificationController.updatePreferences);
router.post("/read-all", authenticate, notificationController.markAllRead);
router.delete("/clear", authenticate, notificationController.clearAll);

// Manual trigger for background reminder checks (Admins & Treasurers)
router.post(
  "/run-reminders",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  notificationController.runReminders,
);

// General notification management
router.get("/", authenticate, notificationController.list);
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  notificationController.create,
);
router.get("/:id", authenticate, notificationController.getById);
router.patch("/:id/read", authenticate, notificationController.markRead);
router.delete("/:id", authenticate, notificationController.remove);

export default router;
