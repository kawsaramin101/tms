import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/error.middleware.js";
import { toTransactionDto } from "./transaction.types.js";
import type {
  AccountBalance,
  CreateTransactionRequest,
  TransactionDto,
  TransactionStatus,
  TransactionTotals,
  UpdateTransactionRequest,
} from "@tms/contracts";

const DEBIT_TYPES = ["DEBIT", "PAYMENT"];
const CREDIT_TYPES = ["CREDIT", "RECEIPT"];

async function writeAudit(
  actorId: number,
  action: string,
  recordId: number | null,
  description: string,
  ipAddress?: string,
) {
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      tableName: "transactions",
      recordId,
      description,
      ipAddress: ipAddress ?? null,
    },
  });
}

function buildWhere(query: {
  search?: string | undefined;
  type?: string | undefined;
  accountId?: number | undefined;
  status?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}) {
  return {
    ...(query.type ? { transactionType: query.type } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.from || query.to
      ? {
          transactionDate: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { transactionNumber: { contains: query.search } },
            { category: { contains: query.search } },
            { referenceNumber: { contains: query.search } },
            { description: { contains: query.search } },
          ],
        }
      : {}),
  };
}

export async function listTransactions(query: {
  search?: string | undefined;
  type?: string | undefined;
  accountId?: number | undefined;
  status?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  sortBy?: "date" | "amount" | "type" | undefined;
  order?: "asc" | "desc" | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const order = query.order ?? "desc";
  const orderBy =
    query.sortBy === "amount"
      ? { amount: order }
      : query.sortBy === "type"
        ? { transactionType: order }
        : { transactionDate: order };

  const where = buildWhere(query);
  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return {
    data: rows.map(toTransactionDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTransaction(id: number): Promise<TransactionDto> {
  const t = await prisma.transaction.findUnique({
    where: { transactionId: id },
  });
  if (!t) throw new HttpError(404, "Transaction not found");
  return toTransactionDto(t);
}

export async function createTransaction(
  actorId: number,
  body: CreateTransactionRequest,
  ipAddress?: string,
): Promise<TransactionDto> {
  const account = await prisma.account.findUnique({
    where: { accountId: body.accountId },
  });
  if (!account) throw new HttpError(404, "Account not found");

  const transactionNumber = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created = await prisma.transaction.create({
    data: {
      transactionNumber,
      accountId: body.accountId,
      transactionType: body.transactionType,
      category: body.category ?? null,
      amount: body.amount,
      description: body.description ?? null,
      referenceNumber: body.referenceNumber ?? null,
      transactionDate: body.transactionDate
        ? new Date(body.transactionDate)
        : new Date(),
      status: body.status ?? "COMPLETED",
      createdBy: actorId,
    },
  });
  await writeAudit(
    actorId,
    "CREATE",
    created.transactionId,
    `Created transaction ${created.transactionNumber}`,
    ipAddress,
  );
  return toTransactionDto(created);
}

export async function updateTransaction(
  actorId: number,
  id: number,
  body: UpdateTransactionRequest,
  ipAddress?: string,
): Promise<TransactionDto> {
  const existing = await prisma.transaction.findUnique({
    where: { transactionId: id },
  });
  if (!existing) throw new HttpError(404, "Transaction not found");

  const updated = await prisma.transaction.update({
    where: { transactionId: id },
    data: {
      ...(body.accountId !== undefined ? { accountId: body.accountId } : {}),
      ...(body.transactionType !== undefined
        ? { transactionType: body.transactionType }
        : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.amount !== undefined ? { amount: body.amount } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.referenceNumber !== undefined
        ? { referenceNumber: body.referenceNumber }
        : {}),
      ...(body.transactionDate !== undefined
        ? { transactionDate: new Date(body.transactionDate) }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });
  await writeAudit(
    actorId,
    "UPDATE",
    id,
    `Updated transaction ${updated.transactionNumber}`,
    ipAddress,
  );
  return toTransactionDto(updated);
}

export async function updateTransactionStatus(
  actorId: number,
  id: number,
  status: TransactionStatus,
  ipAddress?: string,
): Promise<TransactionDto> {
  const existing = await prisma.transaction.findUnique({
    where: { transactionId: id },
  });
  if (!existing) throw new HttpError(404, "Transaction not found");
  const updated = await prisma.transaction.update({
    where: { transactionId: id },
    data: { status },
  });
  await writeAudit(
    actorId,
    "UPDATE_STATUS",
    id,
    `Transaction ${updated.transactionNumber} status set to ${status}`,
    ipAddress,
  );
  return toTransactionDto(updated);
}

export async function deleteTransaction(
  actorId: number,
  id: number,
  ipAddress?: string,
) {
  const existing = await prisma.transaction.findUnique({
    where: { transactionId: id },
  });
  if (!existing) throw new HttpError(404, "Transaction not found");
  await prisma.transaction.delete({ where: { transactionId: id } });
  await writeAudit(
    actorId,
    "DELETE",
    id,
    `Deleted transaction ${existing.transactionNumber}`,
    ipAddress,
  );
  return { message: "Transaction deleted" };
}

export async function getTotals(query: {
  from?: string | undefined;
  to?: string | undefined;
  accountId?: number | undefined;
}): Promise<TransactionTotals> {
  const where = {
    status: "COMPLETED",
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.from || query.to
      ? {
          transactionDate: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
  };

  const [count, sum, byType, byAccount] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({ where, _sum: { amount: true } }),
    prisma.transaction.groupBy({
      by: ["transactionType"],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["accountId"],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  return {
    from: query.from ?? null,
    to: query.to ?? null,
    count,
    totalAmount: Number(sum._sum.amount ?? 0),
    byType: byType.map((row) => ({
      transactionType: row.transactionType,
      count: row._count._all,
      totalAmount: Number(row._sum.amount ?? 0),
    })),
    byAccount: byAccount.map((row) => ({
      accountId: row.accountId,
      count: row._count._all,
      totalAmount: Number(row._sum.amount ?? 0),
    })),
  };
}

export async function getAccountBalance(
  accountId: number,
): Promise<AccountBalance> {
  const account = await prisma.account.findUnique({ where: { accountId } });
  if (!account) throw new HttpError(404, "Account not found");

  const rows = await prisma.transaction.groupBy({
    by: ["transactionType"],
    where: { accountId, status: "COMPLETED" },
    _sum: { amount: true },
  });

  let credit = 0;
  let debit = 0;
  for (const row of rows) {
    const total = Number(row._sum.amount ?? 0);
    if (CREDIT_TYPES.includes(row.transactionType)) credit += total;
    else if (DEBIT_TYPES.includes(row.transactionType)) debit += total;
  }

  const openingBalance = Number(account.openingBalance);
  return {
    accountId,
    openingBalance,
    totalCredit: credit,
    totalDebit: debit,
    runningBalance: openingBalance + credit - debit,
  };
}
