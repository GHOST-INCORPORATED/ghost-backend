// src/types/payment.types.ts
import { Timestamp } from "firebase-admin/firestore";

export interface PaymentRecord {
  id: string;
  escrowId: string;
  userId: string;
  amount: number;
  reference: string;
  status: PaymentStatus;
  createdAt: Timestamp;
  paidAt: Timestamp | null;
  paymentMethod: string;
}

export enum PaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}
