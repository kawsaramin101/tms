import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/error.middleware.js";
import { toAccountDto } from "./account.types.js";
import type {
  AccountDto,
  CreateAccountRequest,
  UpdateAccountRequest,
} from "@tms/contracts";

export async function listAccounts(): Promise<AccountDto[]> {
  const accounts = await prisma.account.findMany({
    orderBy: { accountName: "asc" },
  });
  return accounts.map(toAccountDto);
}

export async function getAccount(id: number): Promise<AccountDto> {
  const account = await prisma.account.findUnique({
    where: { accountId: id },
  });
  if (!account) throw new HttpError(404, "Account not found");
  return toAccountDto(account);
}

export async function createAccount(
  body: CreateAccountRequest,
): Promise<AccountDto> {
  const openingBalance = body.openingBalance ?? 0;
  const account = await prisma.account.create({
    data: {
      accountName: body.accountName,
      accountType: body.accountType,
      accountNumber: body.accountNumber ?? null,
      openingBalance,
      currentBalance: openingBalance,
      status: "ACTIVE",
    },
  });
  return toAccountDto(account);
}

export async function updateAccount(
  id: number,
  body: UpdateAccountRequest,
): Promise<AccountDto> {
  const existing = await prisma.account.findUnique({
    where: { accountId: id },
  });
  if (!existing) throw new HttpError(404, "Account not found");
  const updated = await prisma.account.update({
    where: { accountId: id },
    data: {
      ...(body.accountName !== undefined
        ? { accountName: body.accountName }
        : {}),
      ...(body.accountType !== undefined
        ? { accountType: body.accountType }
        : {}),
      ...(body.accountNumber !== undefined
        ? { accountNumber: body.accountNumber }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });
  return toAccountDto(updated);
}

export async function deleteAccount(id: number) {
  const existing = await prisma.account.findUnique({
    where: { accountId: id },
  });
  if (!existing) throw new HttpError(404, "Account not found");
  const transactionCount = await prisma.transaction.count({
    where: { accountId: id },
  });
  if (transactionCount > 0) {
    throw new HttpError(
      409,
      "Account has transactions and cannot be deleted",
    );
  }
  await prisma.account.delete({ where: { accountId: id } });
  return { message: "Account deleted" };
}
