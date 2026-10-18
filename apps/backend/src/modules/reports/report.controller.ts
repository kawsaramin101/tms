import type { Request, Response, NextFunction } from "express";
import {
  getTransactionVoucherStatusReport,
  getInventoryStatusBalanceReport,
  getProgrammeReport,
  getProgrammeIncomeReport,
  getProgrammeExpenditureReport,
  getBudgetVsActualReport,
  getFinancialReconciliationReport,
  getFinalProgrammeReport,
  createProgramme,
  createBudget,
} from "./report.service";

export const getTransactionVoucherStatusReportController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await getTransactionVoucherStatusReport();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryStatusBalanceReportController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await getInventoryStatusBalanceReport();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getProgrammeReportController = async (
  _req: Request,
  res: Response,
) => {
  const programmes = await getProgrammeReport();

  res.status(200).json({
    success: true,
    data: programmes,
  });
};

export const getProgrammeIncomeReportController = async (
  _req: Request,
  res: Response,
) => {
  const income = await getProgrammeIncomeReport();

  res.status(200).json({
    success: true,
    data: income,
  });
};

export const getProgrammeExpenditureReportController = async (
  _req: Request,
  res: Response,
) => {
  const expenditure = await getProgrammeExpenditureReport();

  res.status(200).json({
    success: true,
    data: expenditure,
  });
};

export const getBudgetVsActualReportController = async (
  _req: Request,
  res: Response,
) => {
  const report = await getBudgetVsActualReport();

  res.status(200).json({
    success: true,
    data: report,
  });
};

export const getFinancialReconciliationReportController = async (
  _req: Request,
  res: Response,
) => {
  const report = await getFinancialReconciliationReport();

  res.status(200).json({
    success: true,
    data: report,
  });
};

export const getFinalProgrammeReportController = async (
  _req: Request,
  res: Response,
) => {
  const report = await getFinalProgrammeReport();

  res.status(200).json({
    success: true,
    data: report,
  });
};

// for testing purposes only
// Programme and budget creation controllers
export const createProgrammeController = async (
  req: Request,
  res: Response,
) => {
  const programme = await createProgramme({
    programmeCode: req.body.programmeCode,
    programmeName: req.body.programmeName,
    startDate: new Date(req.body.startDate),
    status: req.body.status,

    ...(req.body.description !== undefined && {
      description: req.body.description,
    }),

    ...(req.body.endDate !== undefined && {
      endDate: new Date(req.body.endDate),
    }),
  });

  res.status(201).json({
    success: true,
    data: programme,
  });
};

export const createBudgetController = async (req: Request, res: Response) => {
  const budget = await createBudget({
    programmeId: Number(req.body.programmeId),
    category: req.body.category,
    budgetAmount: Number(req.body.budgetAmount),
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
    status: req.body.status,
  });

  res.status(201).json({
    success: true,
    data: budget,
  });
};
