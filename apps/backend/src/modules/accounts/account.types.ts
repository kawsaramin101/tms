import type { AccountDto } from "@tms/contracts";
import type { Account } from "@prisma/client";

export function toAccountDto(a: Account): AccountDto {
  return {
    accountId: a.accountId,
    accountName: a.accountName,
    accountType: a.accountType,
    accountNumber: a.accountNumber,
    openingBalance: Number(a.openingBalance),
    currentBalance: Number(a.currentBalance),
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  };
}
