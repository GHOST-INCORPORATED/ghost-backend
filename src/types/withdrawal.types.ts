// src/types/withdrawal.types.ts
import { Timestamp } from "firebase-admin/firestore";

export interface WithdrawalRecord {
  id: string;
  escrowId: string;
  userId: string;
  amount: number;
  status: WithdrawalStatus;
  transferReference: string;
  paymentRef?: string;
  notes?: string;
  createdAt: Timestamp;
  processedAt: Timestamp | null;
}

export enum WithdrawalStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
}

export interface ProcessWithdrawalRequest {
  escrowId: string;
  withdrawalId: string;
  userId: string;
}
