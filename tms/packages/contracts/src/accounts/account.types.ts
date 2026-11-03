export interface AccountDto {
  accountId: number;
  accountName: string;
  accountType: string;
  accountNumber: string | null;
  openingBalance: number;
  currentBalance: number;
  status: string;
  createdAt: string;
}

export interface CreateAccountRequest {
  accountName: string;
  accountType: string;
  accountNumber?: string | undefined;
  openingBalance?: number | undefined;
}

export interface UpdateAccountRequest {
  accountName?: string | undefined;
  accountType?: string | undefined;
  accountNumber?: string | null | undefined;
  status?: string | undefined;
}
