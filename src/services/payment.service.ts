// src/services/payment.service.ts
import axios from "axios";
import { db } from "../config/firebase";
import { PAYSTACK_API_URL, PAYSTACK_SECRET_KEY } from "../config/paystack";
import { PaymentRecord, PaymentStatus, PaystackVerifyResponse } from "../types";
import { generateRandomId } from "../utils/crypto";
import logger from "../utils/logger";
import { AppError } from "../middlewares/error";

export class PaymentService {
  /**
   * Verify a Paystack payment
   * @param reference Payment reference
   */
  async verifyPaystackPayment(
    reference: string
  ): Promise<PaystackVerifyResponse["data"]> {
    try {
      const response = await axios.get<PaystackVerifyResponse>(
        `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      if (!response.data.status || response.data.data.status !== "success") {
        throw new AppError("Payment verification failed", 400);
      }

      return response.data.data;
    } catch (error: any) {
      logger.error("Payment verification error:", {
        error: error.message,
        reference,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to verify payment", 500);
    }
  }

  /**
   * Create a new payment record
   * @param data Payment data
   */
  async createPayment(
    data: Omit<PaymentRecord, "id" | "createdAt" | "paidAt" | "status">
  ): Promise<PaymentRecord> {
    try {
      const paymentId = generateRandomId();
      const now = new Date();

      const payment: PaymentRecord = {
        id: paymentId,
        status: PaymentStatus.PENDING,
        createdAt: now as any, // Firestore will convert to Timestamp
        paidAt: null,
        ...data,
      };

      await db.collection("payments").doc(paymentId).set(payment);
      return payment;
    } catch (error: any) {
      logger.error("Create payment error:", { error: error.message });
      throw new AppError("Failed to create payment record", 500);
    }
  }

  /**
   * Update payment status
   * @param reference Payment reference
   * @param status New status
   */
  async updatePaymentStatus(
    reference: string,
    status: PaymentStatus
  ): Promise<void> {
    try {
      const paymentsRef = db.collection("payments");
      // Fetch by document ID instead of querying
      const docSnap = await paymentsRef.doc(reference).get();

      // Make sure it exists
      if (!docSnap.exists) {
        throw new AppError("Payment not found", 404);
      }

      // Prepare your update
      const updateData: Partial<PaymentRecord> = {
        status,
        paidAt: status === PaymentStatus.SUCCESS ? (new Date() as any) : null,
      };

      // Apply the update
      await docSnap.ref.update(updateData);
    } catch (error: any) {
      logger.error("Update payment status error:", {
        error: error.message,
        reference,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update payment status", 500);
    }
  }

  /**
   * Get payment by reference
   * @param reference Payment reference
   */
  async getPaymentByReference(
    reference: string
  ): Promise<PaymentRecord | null> {
    try {
      const paymentsRef = db.collection("payments");
      const querySnapshot = await paymentsRef
        .where("reference", "==", reference)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const paymentDoc = querySnapshot.docs[0];
      return paymentDoc.data() as PaymentRecord;
    } catch (error: any) {
      logger.error("Get payment error:", { error: error.message, reference });
      throw new AppError("Failed to retrieve payment", 500);
    }
  }
}

export default new PaymentService();
