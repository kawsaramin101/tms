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
