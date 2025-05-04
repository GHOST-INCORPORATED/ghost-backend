// src/types/escrow.types.ts
import { Timestamp } from "firebase-admin/firestore";

export interface EscrowRecord {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  description: string;
  status: EscrowStatus;
  reference: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paymentVerified: boolean;
  sellerWithdrawn: boolean;
  withdrawnAt: Timestamp | null;
  paystackRecipientCode?: string;
}

export enum EscrowStatus {
  CREATED = "created",
  AWAITING_PAYMENT = "awaiting_payment",
  AWAITING_FEEDBACK = "awaiting_feedback",
  BUYER_CONFIRMED = "buyer_confirmed",
  RELEASED = "released",
  DISPUTED = "disputed",
  REFUNDED = "refunded",
}

export interface CreateEscrowRequest {
  sellerId: string;
  amount: number;
  description: string;
}
