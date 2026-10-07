import { Router } from "express";
import * as transactionController from "./transaction.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, transactionController.list);
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  transactionController.create,
);

router.get("/totals", authenticate, transactionController.totals);
router.get(
  "/accounts/:accountId/balance",
  authenticate,
  transactionController.accountBalance,
);

router.get("/:id", authenticate, transactionController.getById);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  transactionController.update,
);
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  transactionController.updateStatus,
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  transactionController.remove,
);

export default router;
