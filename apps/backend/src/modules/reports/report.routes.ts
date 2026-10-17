import { Router } from "express";
import {
  getTransactionVoucherStatusReportController,
  getInventoryStatusBalanceReportController,
} from "./report.controller";

const router = Router();

router.get(
  "/transaction-voucher-status",
  getTransactionVoucherStatusReportController,
);

router.get(
  "/inventory-status-balance",
  getInventoryStatusBalanceReportController,
);

export default router;
