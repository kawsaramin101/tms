import { apiFetch } from "@/lib/api-client";
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

interface ReportEnvelope<T> { success: boolean; data: T }
function getReport<T>(token: string, path: string): Promise<T> {
  return apiFetch<ReportEnvelope<T>>(path, { token }).then((response) => response.data);
}
export const getProgrammes = (token: string) => getReport<ProgrammeReport[]>(token, "/reports/programmes");
export const getProgrammeIncome = (token: string) => getReport<ProgrammeIncomeReport[]>(token, "/reports/programme-income");
export const getProgrammeExpenditure = (token: string) => getReport<ProgrammeExpenditureReport[]>(token, "/reports/programme-expenditure");
export const getTransactionVoucherStatus = (token: string) => getReport<TransactionVoucherStatusReport>(token, "/reports/transaction-voucher-status");
export const getInventoryStatusBalance = (token: string) => getReport<InventoryStatusBalanceReport>(token, "/reports/inventory-status-balance");
export const getBudgetVsActual = (token: string) => getReport<BudgetVsActualReport[]>(token, "/reports/budget-vs-actual");
export const getFinancialReconciliation = (token: string) => getReport<FinancialReconciliationReport>(token, "/reports/financial-reconciliation");
export const getFinalProgramme = (token: string) => getReport<FinalProgrammeReport[]>(token, "/reports/programme-final");
