import { Router } from "express";
import * as calculationController from "./calculation.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/audit-logs",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  calculationController.listAuditLogs,
);

router.get(
  "/voucher-payments",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  calculationController.listVoucherPaymentTotals,
);

router.get(
  "/vouchers/:voucherId/payments",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  calculationController.getVoucherPayments,
);

router.post(
  "/vouchers/:voucherId/payments",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  calculationController.createVoucherPayment,
);

router.post(
  "/vouchers/:voucherId/payments/:transactionId/reverse",
  authenticate,
  authorize("ADMIN", "TREASURER"),
  calculationController.reverseVoucherPayment,
);

export default router;
