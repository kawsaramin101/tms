import type { Request, Response, NextFunction } from "express";
import {
  getTransactionVoucherStatusReport,
  getInventoryStatusBalanceReport,
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
