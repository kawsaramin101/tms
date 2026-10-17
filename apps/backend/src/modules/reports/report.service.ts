import { prisma } from "../../lib/prisma";
import type {
  TransactionVoucherStatusReport,
  InventoryStatusBalanceReport,
} from "@tms/contracts";

export const getTransactionVoucherStatusReport =
  async (): Promise<TransactionVoucherStatusReport> => {
    const [transactions, vouchers] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      prisma.voucher.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
    ]);

    return {
      transactions: {
        total: transactions.reduce((sum, item) => sum + item._count._all, 0),
        byStatus: transactions.map((item) => ({
          status: item.status,
          count: item._count._all,
        })),
      },
      vouchers: {
        total: vouchers.reduce((sum, item) => sum + item._count._all, 0),
        byStatus: vouchers.map((item) => ({
          status: item.status,
          count: item._count._all,
        })),
      },
    };
  };

export const getInventoryStatusBalanceReport =
  async (): Promise<InventoryStatusBalanceReport> => {
    const items = await prisma.item.findMany({
      select: {
        itemId: true,
        itemCode: true,
        itemName: true,
        quantity: true,
        minimumQuantity: true,
        unit: true,
        unitPrice: true,
        status: true,
      },
    });

    const inventoryItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const minimumQuantity = Number(item.minimumQuantity);
      const unitPrice = Number(item.unitPrice);

      let stockStatus = "IN_STOCK";

      if (quantity === 0) {
        stockStatus = "OUT_OF_STOCK";
      } else if (quantity <= minimumQuantity) {
        stockStatus = "LOW_STOCK";
      }

      return {
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity,
        minimumQuantity,
        unit: item.unit,
        unitPrice,
        inventoryValue: quantity * unitPrice,
        status: stockStatus,
      };
    });

    return {
      inventory: {
        totalItems: inventoryItems.length,

        totalQuantity: inventoryItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        ),

        totalInventoryValue: inventoryItems.reduce(
          (sum, item) => sum + item.inventoryValue,
          0,
        ),

        activeItems: items.filter((item) => item.status === "ACTIVE").length,

        lowStockItems: inventoryItems.filter(
          (item) => item.status === "LOW_STOCK",
        ).length,

        outOfStockItems: inventoryItems.filter(
          (item) => item.status === "OUT_OF_STOCK",
        ).length,
      },

      items: inventoryItems,
    };
  };
