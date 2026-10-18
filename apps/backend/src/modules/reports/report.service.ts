import { prisma } from "../../lib/prisma";
import type {
  TransactionVoucherStatusReport,
  InventoryStatusBalanceReport,
  ProgrammeReport,
  ProgrammeIncomeReport,
  ProgrammeExpenditureReport,
  BudgetVsActualReport,
  FinancialReconciliationReport,
  FinalProgrammeReport,
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

export const getProgrammeReport = async (): Promise<ProgrammeReport[]> => {
  const programmes = await prisma.programme.findMany({
    select: {
      programmeId: true,
      programmeCode: true,
      programmeName: true,
      description: true,
      startDate: true,
      endDate: true,
      status: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return programmes;
};

export const getProgrammeIncomeReport = async (): Promise<
  ProgrammeIncomeReport[]
> => {
  const programmes = await prisma.programme.findMany({
    select: {
      programmeId: true,
      programmeCode: true,
      programmeName: true,
      transactions: {
        where: {
          transactionType: "CREDIT",
          status: "COMPLETED",
        },
        select: {
          amount: true,
        },
      },
    },
  });

  return programmes.map((programme) => ({
    programmeId: programme.programmeId,
    programmeCode: programme.programmeCode,
    programmeName: programme.programmeName,
    totalIncome: programme.transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    ),
  }));
};

export const getProgrammeExpenditureReport = async (): Promise<
  ProgrammeExpenditureReport[]
> => {
  const programmes = await prisma.programme.findMany({
    select: {
      programmeId: true,
      programmeCode: true,
      programmeName: true,
      transactions: {
        where: {
          transactionType: "DEBIT",
          status: "COMPLETED",
        },
        select: {
          amount: true,
        },
      },
    },
  });

  return programmes.map((programme) => ({
    programmeId: programme.programmeId,
    programmeCode: programme.programmeCode,
    programmeName: programme.programmeName,
    totalExpenditure: programme.transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    ),
  }));
};

export const getBudgetVsActualReport = async (): Promise<
  BudgetVsActualReport[]
> => {
  const budgets = await prisma.budget.findMany({
    select: {
      budgetId: true,
      programmeId: true,
      category: true,
      budgetAmount: true,
      programme: {
        select: {
          programmeCode: true,
          programmeName: true,
          transactions: {
            where: {
              transactionType: "DEBIT",
              status: "COMPLETED",
            },
            select: {
              amount: true,
              category: true,
            },
          },
        },
      },
    },
  });

  return budgets.map((budget) => {
    const actualExpenditure = budget.programme.transactions
      .filter((transaction) => transaction.category === budget.category)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const budgetAmount = Number(budget.budgetAmount);

    return {
      budgetId: budget.budgetId,
      programmeId: budget.programmeId,
      programmeCode: budget.programme.programmeCode,
      programmeName: budget.programme.programmeName,
      category: budget.category,
      budgetAmount,
      actualExpenditure,
      variance: budgetAmount - actualExpenditure,
    };
  });
};

export const getFinancialReconciliationReport =
  async (): Promise<FinancialReconciliationReport> => {
    const transactions = await prisma.transaction.findMany({
      select: {
        amount: true,
        status: true,
      },
    });

    return {
      totalTransactions: transactions.length,

      pendingTransactions: transactions.filter(
        (transaction) => transaction.status === "PENDING",
      ).length,

      cancelledTransactions: transactions.filter(
        (transaction) => transaction.status === "CANCELLED",
      ).length,

      completedTransactions: transactions.filter(
        (transaction) => transaction.status === "COMPLETED",
      ).length,

      pendingAmount: transactions
        .filter((transaction) => transaction.status === "PENDING")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    };
  };

export const getFinalProgrammeReport = async (): Promise<
  FinalProgrammeReport[]
> => {
  const programmes = await prisma.programme.findMany({
    select: {
      programmeId: true,
      programmeCode: true,
      programmeName: true,
      description: true,
      startDate: true,
      endDate: true,
      status: true,

      transactions: {
        where: {
          status: "COMPLETED",
        },
        select: {
          transactionType: true,
          amount: true,
        },
      },

      budgets: {
        select: {
          budgetAmount: true,
        },
      },
    },
  });

  return programmes.map((programme) => {
    const totalIncome = programme.transactions
      .filter((transaction) => transaction.transactionType === "CREDIT")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const totalExpenditure = programme.transactions
      .filter((transaction) => transaction.transactionType === "DEBIT")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const budgetAmount = programme.budgets.reduce(
      (sum, budget) => sum + Number(budget.budgetAmount),
      0,
    );

    return {
      programmeId: programme.programmeId,
      programmeCode: programme.programmeCode,
      programmeName: programme.programmeName,
      description: programme.description,
      startDate: programme.startDate,
      endDate: programme.endDate,
      status: programme.status,
      totalIncome,
      totalExpenditure,
      budgetAmount,
      actualExpenditure: totalExpenditure,
      budgetVariance: budgetAmount - totalExpenditure,
    };
  });
};

// for testing purposes only
// Programme and budget creation services
export const createProgramme = async (data: {
  programmeCode: string;
  programmeName: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: string;
}) => {
  return prisma.programme.create({
    data: {
      programmeCode: data.programmeCode,
      programmeName: data.programmeName,
      startDate: data.startDate,
      status: data.status,

      ...(data.description !== undefined && {
        description: data.description,
      }),

      ...(data.endDate !== undefined && {
        endDate: data.endDate,
      }),
    },
  });
};

export const createBudget = async (data: {
  programmeId: number;
  category: string;
  budgetAmount: number;
  startDate: Date;
  endDate: Date;
  status: string;
}) => {
  return prisma.budget.create({
    data: {
      programmeId: data.programmeId,
      category: data.category,
      budgetAmount: data.budgetAmount,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    },
  });
};
