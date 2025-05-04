// src/types/user.types.ts
export interface UserBankDetail {
  bankAccountNumber: string;
  bankCode: string;
  fullName: string;
  paystackRecipientCode: string;
}

export interface BankDetailsRequest {
  bankAccountNumber: string;
  bankCode: string;
  fullName: string;
}
