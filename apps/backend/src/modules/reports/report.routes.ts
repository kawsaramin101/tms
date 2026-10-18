import { Router } from "express";
import {
  getTransactionVoucherStatusReportController,
  getInventoryStatusBalanceReportController,
  getProgrammeReportController,
  getProgrammeIncomeReportController,
  getProgrammeExpenditureReportController,
  getBudgetVsActualReportController,
  getFinancialReconciliationReportController,
  getFinalProgrammeReportController,
  createProgrammeController,
  createBudgetController,
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

router.get("/programmes", getProgrammeReportController);

router.get("/programme-income", getProgrammeIncomeReportController);
router.get("/programme-expenditure", getProgrammeExpenditureReportController);
router.get("/budget-vs-actual", getBudgetVsActualReportController);
router.get(
  "/financial-reconciliation",
  getFinancialReconciliationReportController,
);

router.get("/programme-final", getFinalProgrammeReportController);

// for testing purposes only
// Programme and budget creation endpoints
router.post("/programmes", createProgrammeController);

router.post("/budgets", createBudgetController);
export default router;
