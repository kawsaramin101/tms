import type {
  BudgetVsActualReport,
  FinancialReconciliationReport,
  FinalProgrammeReport,
  InventoryStatusBalanceReport,
  ProgrammeExpenditureReport,
  ProgrammeIncomeReport,
  ProgrammeReport,
  TransactionVoucherStatusReport,
} from "@tms/contracts";

export type ReportData = {
  programmes: ProgrammeReport[];
  income: ProgrammeIncomeReport[];
  expenditure: ProgrammeExpenditureReport[];
  status: TransactionVoucherStatusReport;
  inventory: InventoryStatusBalanceReport;
  budgetVsActual: BudgetVsActualReport[];
  reconciliation: FinancialReconciliationReport;
  final: FinalProgrammeReport[];
};

export type ReportKey = keyof ReportData;

export type ReconciliationRow = {
  status: "Matched" | "Unmatched" | "Amount Mismatch";
  voucherNumber: string | null;
  transactionNumber: string | null;
  expectedAmount: number | null;
  actualAmount: number | null;
  difference: number | null;
};
