import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/error.middleware.js";
import {
  toAuditLogDto,
  type AuditLogListResponse,
} from "./calculation.types.js";
import type { ListAuditLogsQuery } from "./calculation.validation.js";
import type {
  VoucherPaymentSummaryDto,
  VoucherPaymentTotalsDto,
} from "@tms/contracts";
import {
  derivePaymentStatus,
  qualifyingTransactionTypes,
  roundMoney,
  toVoucherPaymentSummary,
} from "./calculation.types.js";
import type { CreateVoucherPaymentInput } from "./calculation.validation.js";

const PAYMENT_INCLUDE = {
  creator: { select: { name: true } },
} as const;

const VOUCHER_PAYMENT_INCLUDE = {
  payments: {
    include: PAYMENT_INCLUDE,
    orderBy: { createdAt: "asc" },
  },
} as const;

async function writePaymentAudit(
  actorId: number,
  action: string,
  voucherId: number,
  description: string,
  ipAddress?: string,
) {
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      tableName: "vouchers",
      recordId: voucherId,
      description,
      ipAddress: ipAddress ?? null,
    },
  });
}

async function qualifyingPaidTotal(
  client: Prisma.TransactionClient,
  voucherId: number,
  voucherType: string,
): Promise<Prisma.Decimal> {
  const aggregate = await client.transaction.aggregate({
    where: {
      voucherId,
      status: "COMPLETED",
      transactionType: { in: qualifyingTransactionTypes(voucherType) },
    },
    _sum: { amount: true },
  });
  return new Prisma.Decimal(aggregate._sum.amount ?? 0);
}

async function reconcilePaidAmount(
  client: Prisma.TransactionClient,
  voucher: {
    voucherId: number;
    voucherType: string;
    paidAmount: unknown;
  },
): Promise<Prisma.Decimal> {
  const paid = await qualifyingPaidTotal(
    client,
    voucher.voucherId,
    voucher.voucherType,
  );
  if (!new Prisma.Decimal(voucher.paidAmount as Prisma.Decimal).equals(paid)) {
    await client.voucher.updateMany({
      where: {
        voucherId: voucher.voucherId,
        paidAmount: voucher.paidAmount as Prisma.Decimal,
      },
      data: { paidAmount: paid },
    });
  }
  return paid;
}

export async function getVoucherPaymentSummary(
  voucherId: number,
): Promise<VoucherPaymentSummaryDto> {
  const voucher = await prisma.voucher.findUnique({
    where: { voucherId },
    include: VOUCHER_PAYMENT_INCLUDE,
  });
  if (!voucher) throw new HttpError(404, "Voucher not found");
  const paidAmount = await reconcilePaidAmount(prisma, voucher);
  return toVoucherPaymentSummary({ ...voucher, paidAmount });
}

export async function recordVoucherPayment(
  actorId: number,
  voucherId: number,
  body: CreateVoucherPaymentInput,
  ipAddress?: string,
): Promise<VoucherPaymentSummaryDto> {
  const referenceNumber = body.referenceNumber ?? null;
  let payment = { amount: 0, transactionNumber: "", voucherNumber: "" };
  try {
    payment = await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findUnique({ where: { voucherId } });
      if (!voucher) throw new HttpError(404, "Voucher not found");
      if (voucher.status === "CANCELLED") {
        throw new HttpError(
          409,
          "Cannot record a payment for a cancelled voucher",
        );
      }
      if (voucher.status === "REJECTED") {
        throw new HttpError(
          409,
          "Cannot record a payment for a rejected voucher",
        );
      }

      const account = await tx.account.findUnique({
        where: { accountId: body.accountId },
      });
      if (!account) throw new HttpError(404, "Account not found");

      if (referenceNumber) {
        const duplicate = await tx.transaction.findFirst({
          where: {
            voucherId,
            referenceNumber,
            status: { not: "CANCELLED" },
          },
          select: { transactionId: true },
        });
        if (duplicate) {
          throw new HttpError(
            409,
            "A payment with this reference already exists for this voucher",
          );
        }
      }

      const paid = await qualifyingPaidTotal(
        tx,
        voucherId,
        voucher.voucherType,
      );
      const voucherAmount = new Prisma.Decimal(
        voucher.amount as Prisma.Decimal,
      );
      const outstanding = voucherAmount.minus(paid);
      if (outstanding.lessThanOrEqualTo(0)) {
        throw new HttpError(409, "This voucher has already been fully settled");
      }
      const paymentAmount = new Prisma.Decimal(String(body.amount));
      if (paymentAmount.greaterThan(outstanding)) {
        throw new HttpError(
          400,
          `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}`,
        );
      }

      const linkedTransaction = await tx.transaction.findUnique({
        where: { transactionId: voucher.transactionId },
      });
      if (!linkedTransaction) {
        throw new HttpError(
          409,
          "This voucher is not linked to an existing transaction",
        );
      }

      const transactionNumber = linkedTransaction.transactionNumber;
      const transactionType =
        voucher.voucherType === "RECEIPT" ? "RECEIPT" : "PAYMENT";
      await tx.transaction.update({
        where: { transactionId: linkedTransaction.transactionId },
        data: {
          accountId: body.accountId,
          voucherId,
          transactionType,
          amount: paymentAmount,
          description:
            body.description ?? `Payment for voucher ${voucher.voucherNumber}`,
          referenceNumber,
          transactionDate: body.transactionDate
            ? new Date(body.transactionDate)
            : new Date(),
          status: "COMPLETED",
        },
      });

      const paidAfter = await qualifyingPaidTotal(
        tx,
        voucherId,
        voucher.voucherType,
      );
      const claimed = await tx.voucher.updateMany({
        where: {
          voucherId,
          paidAmount: voucher.paidAmount as Prisma.Decimal,
        },
        data: { paidAmount: paidAfter },
      });
      if (claimed.count === 0) {
        throw new HttpError(
          409,
          "Voucher was updated concurrently, please retry",
        );
      }

      return {
        amount: Number(paymentAmount),
        transactionNumber,
        voucherNumber: voucher.voucherNumber,
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(
        409,
        "A payment with this reference already exists for this voucher",
      );
    }
    throw error;
  }

  await writePaymentAudit(
    actorId,
    "CREATE_PAYMENT",
    voucherId,
    `Recorded payment ${roundMoney(payment.amount).toFixed(2)} for voucher ${payment.voucherNumber} (transaction ${payment.transactionNumber})`,
    ipAddress,
  );
  return getVoucherPaymentSummary(voucherId);
}

export async function reverseVoucherPayment(
  actorId: number,
  voucherId: number,
  transactionId: number,
  ipAddress?: string,
): Promise<VoucherPaymentSummaryDto> {
  const reversal = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { transactionId },
    });
    if (!transaction || transaction.voucherId !== voucherId) {
      throw new HttpError(404, "Payment not found for this voucher");
    }
    if (transaction.status === "CANCELLED") {
      throw new HttpError(409, "Payment has already been reversed");
    }

    const voucher = await tx.voucher.findUnique({ where: { voucherId } });
    if (!voucher) throw new HttpError(404, "Voucher not found");

    await tx.transaction.update({
      where: { transactionId },
      data: { status: "CANCELLED" },
    });

    const paid = await qualifyingPaidTotal(tx, voucherId, voucher.voucherType);
    const claimed = await tx.voucher.updateMany({
      where: {
        voucherId,
        paidAmount: voucher.paidAmount as Prisma.Decimal,
      },
      data: { paidAmount: paid },
    });
    if (claimed.count === 0) {
      throw new HttpError(409, "Voucher was updated concurrently, please retry");
    }

    return {
      amount: Number(transaction.amount),
      transactionNumber: transaction.transactionNumber,
      voucherNumber: voucher.voucherNumber,
    };
  });

  await writePaymentAudit(
    actorId,
    "REVERSE_PAYMENT",
    voucherId,
    `Reversed payment ${roundMoney(reversal.amount).toFixed(2)} for voucher ${reversal.voucherNumber} (transaction ${reversal.transactionNumber})`,
    ipAddress,
  );
  return getVoucherPaymentSummary(voucherId);
}

export async function listVoucherPaymentTotals(): Promise<
  VoucherPaymentTotalsDto[]
> {
  const [vouchers, grouped] = await Promise.all([
    prisma.voucher.findMany({
      select: {
        voucherId: true,
        voucherType: true,
        amount: true,
        paidAmount: true,
        status: true,
      },
      orderBy: { voucherId: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["voucherId", "transactionType"],
      where: { voucherId: { not: null }, status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const typeById = new Map<number, string>();
  for (const voucher of vouchers) {
    typeById.set(voucher.voucherId, voucher.voucherType);
  }

  const paidByVoucher = new Map<number, Prisma.Decimal>();
  for (const row of grouped) {
    const voucherId = row.voucherId;
    if (voucherId === null) continue;
    const voucherType = typeById.get(voucherId);
    if (!voucherType) continue;
    if (!qualifyingTransactionTypes(voucherType).includes(row.transactionType)) {
      continue;
    }
    const current = paidByVoucher.get(voucherId) ?? new Prisma.Decimal(0);
    paidByVoucher.set(
      voucherId,
      current.plus(new Prisma.Decimal(row._sum.amount ?? 0)),
    );
  }

  const totals: VoucherPaymentTotalsDto[] = [];
  for (const voucher of vouchers) {
    const computed =
      paidByVoucher.get(voucher.voucherId) ?? new Prisma.Decimal(0);
    const stored = new Prisma.Decimal(voucher.paidAmount as Prisma.Decimal);
    if (!stored.equals(computed)) {
      await prisma.voucher.updateMany({
        where: { voucherId: voucher.voucherId, paidAmount: stored },
        data: { paidAmount: computed },
      });
    }
    const amount = Number(voucher.amount);
    const paidAmount = roundMoney(Number(computed));
    totals.push({
      voucherId: voucher.voucherId,
      voucherType: voucher.voucherType,
      voucherStatus: voucher.status,
      amount,
      paidAmount,
      outstandingAmount: roundMoney(Math.max(0, amount - paidAmount)),
      paymentStatus: derivePaymentStatus(voucher.status, paidAmount, amount),
    });
  }
  return totals;
}

function buildWhere(query: ListAuditLogsQuery) {
  return {
    ...(query.recordId !== undefined ? { recordId: query.recordId } : {}),
    ...(query.tableName ? { tableName: query.tableName } : {}),
    ...(query.userId !== undefined ? { userId: query.userId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
  };
}

export async function listAuditLogs(
  query: ListAuditLogsQuery,
): Promise<AuditLogListResponse> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const where = buildWhere(query);
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { userId: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return {
    data: rows.map(toAuditLogDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
