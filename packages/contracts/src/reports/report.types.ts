export interface StatusCount {
  status: string;
  count: number;
}

export interface TransactionVoucherStatusReport {
  transactions: {
    total: number;
    byStatus: StatusCount[];
  };
  vouchers: {
    total: number;
    byStatus: StatusCount[];
  };
}

export interface InventoryItemReport {
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  minimumQuantity: number;
  unit: string;
  unitPrice: number;
  inventoryValue: number;
  status: string;
}

export interface InventoryStatusBalanceReport {
  inventory: {
    totalItems: number;
    totalQuantity: number;
    totalInventoryValue: number;
    activeItems: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  items: InventoryItemReport[];
}

export interface ProgrammeReport {
  programmeId: number;
  programmeCode: string;
  programmeName: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  status: string;
}

export interface ProgrammeIncomeReport {
  programmeId: number;
  programmeCode: string;
  programmeName: string;
  totalIncome: number;
}

export interface ProgrammeExpenditureReport {
  programmeId: number;
  programmeCode: string;
  programmeName: string;
  totalExpenditure: number;
}

export interface BudgetVsActualReport {
  budgetId: number;
  programmeId: number;
  programmeCode: string;
  programmeName: string;
  category: string;
  budgetAmount: number;
  actualExpenditure: number;
  variance: number;
}

export interface FinancialReconciliationReport {
  totalTransactions: number;
  pendingTransactions: number;
  cancelledTransactions: number;
  completedTransactions: number;
  pendingAmount: number;
}

export interface FinalProgrammeReport {
  programmeId: number;
  programmeCode: string;
  programmeName: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  status: string;
  totalIncome: number;
  totalExpenditure: number;
  budgetAmount: number;
  actualExpenditure: number;
  budgetVariance: number;
}
