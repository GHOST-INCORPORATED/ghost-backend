// src/services/transfer.service.ts
import axios from "axios";
import { db } from "../config/firebase";
import { PAYSTACK_API_URL, PAYSTACK_SECRET_KEY } from "../config/paystack";
import {
  WithdrawalRecord,
  WithdrawalStatus,
  PaystackTransferRequest,
  PaystackTransferResponse,
  PaystackTransferRecipient,
  PaystackRecipientResponse,
  UserBankDetail,
} from "../types";
import { generateRandomId } from "../utils/crypto";
import logger from "../utils/logger";
import { AppError } from "../middlewares/error";

export class TransferService {
  /**
   * Create a new recipient on Paystack
   * @param bankDetails User's bank details
   */
  async createPaystackRecipient(bankDetails: UserBankDetail): Promise<string> {
    try {
      const recipientData: PaystackTransferRecipient = {
        type: "nuban",
        name: bankDetails.fullName,
        account_number: bankDetails.bankAccountNumber,
        bank_code: bankDetails.bankCode,
        currency: "NGN",
      };

      logger.info("sending with paystack request");
      const response = await axios.post<PaystackRecipientResponse>(
        `${PAYSTACK_API_URL}/transferrecipient`,
        recipientData,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      logger.info("Done with paystack request", response.data);

      if (!response.data.status) {
        throw new AppError("Failed to create transfer recipient", 400);
      }

      return response.data.data.recipient_code;
    } catch (error: any) {
      logger.error("Create Paystack recipient error:", {
        error: error.message,
      });

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create transfer recipient", 500);
    }
  }

  /**
   * Save user's bank details
   * @param userId User ID
   * @param bankDetails Bank details
   */
  async saveBankDetails(
    userId: string,
    bankDetails: UserBankDetail
  ): Promise<void> {
    try {
      await db.collection("users").doc(userId).update({
        bankAccountNumber: bankDetails.bankAccountNumber,
        bankCode: bankDetails.bankCode,
        fullName: bankDetails.fullName,
        paystackRecipientCode: bankDetails.paystackRecipientCode,
      });
    } catch (error: any) {
      logger.error("Save bank details error:", {
        error: error.message,
        userId,
      });
      throw new AppError("Failed to save bank details", 500);
    }
  }

  /**
   * Initiate a withdrawal/transfer
   * @param escrowId Escrow ID
   * @param userId User ID (seller)
   * @param amount Amount to transfer
   * @param recipientCode Paystack recipient code
   */
  async initiateWithdrawal(
    escrowId: string,
    userId: string,
    amount: number,
    recipientCode: string
  ): Promise<WithdrawalRecord> {
    try {
      const withdrawalId = generateRandomId();
      const transferRef = `transfer_${generateRandomId(100)}`;
      const now = new Date();

      // Create withdrawal record
      const withdrawal: WithdrawalRecord = {
        id: withdrawalId,
        escrowId,
        userId,
        amount,
        status: WithdrawalStatus.PENDING,
        transferReference: transferRef,
        createdAt: now as any,
        processedAt: null,
      };

      await db.collection("withdrawals").doc(withdrawalId).set(withdrawal);
      return withdrawal;
    } catch (error: any) {
      logger.error("Initiate withdrawal error:", {
        error: error.message,
        escrowId,
      });
      throw new AppError("Failed to initiate withdrawal", 500);
    }
  }

  /**
   * Process a withdrawal by making a transfer through Paystack
   * @param escrowId Escrow ID
   * @param withdrawalId Withdrawal ID
   * @param recipientCode Paystack recipient code
   * @param amount Amount in naira
   */
  async processWithdrawal(
    escrowId: string,
    withdrawalId: string,
    recipientCode: string,
    amount: number
  ): Promise<{ status: string; transferCode: string }> {
    try {
      // Get withdrawal record
      const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);
      const withdrawalDoc = await withdrawalRef.get();

      if (!withdrawalDoc.exists) {
        throw new AppError("Withdrawal record not found", 404);
      }

      const transferRequest: PaystackTransferRequest = {
        source: "balance",
        amount: Math.round(amount * 100), // Convert to kobo
        recipient: recipientCode,
        reason: `Payment for escrow ${escrowId}`,
        reference: withdrawalDoc.data()?.transferReference,
      };

      logger.info("Request data", { transferRequest });

      // Initiate transfer with Paystack
      logger.info("Starting Paystack withdrawal request");
      const response = await axios.post<PaystackTransferResponse>(
        `${PAYSTACK_API_URL}/transfer`,
        transferRequest,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      logger.info("Done with Paystack withdrawal request", {
        response: response.data,
      });

      if (!response.data.status) {
        throw new AppError("Transfer initiation failed", 400);
      }

      const transferData = response.data.data;

      // Update withdrawal record
      logger.info("Updating Withdrawal records");
      await withdrawalRef.update({
        status:
          transferData.status === "success"
            ? WithdrawalStatus.PAID
            : WithdrawalStatus.PENDING,
        paymentRef: transferData.transfer_code,
        processedAt: transferData.status === "success" ? new Date() : null,
      });

      return {
        status: transferData.status,
        transferCode: transferData.transfer_code,
      };
    } catch (error: any) {
      logger.error("Process withdrawal error:", {
        error: error.message,
        withdrawalId,
      });

      console.log({ error }, "The error");

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to process withdrawal", 500);
    }
  }

  /**
   * Update a withdrawal status
   * @param transferRef Transfer reference
   * @param status New status
   * @param notes Optional notes (e.g., failure reason)
   */
  async updateWithdrawalStatus(
    transferRef: string,
    status: WithdrawalStatus,
    notes?: string
  ): Promise<void> {
    try {
      const withdrawalsRef = db.collection("withdrawals");
      const querySnapshot = await withdrawalsRef
        .where("transferReference", "==", transferRef)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        throw new AppError("Withdrawal not found", 404);
      }

      const withdrawalDoc = querySnapshot.docs[0];
      const updateData: Partial<WithdrawalRecord> = {
        status,
        processedAt: new Date() as any,
      };

      if (notes) {
        updateData.notes = notes;
      }

      await withdrawalDoc.ref.update(updateData);
    } catch (error: any) {
      logger.error("Update withdrawal status error:", {
        error: error.message,
        transferRef,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update withdrawal status", 500);
    }
  }
}

export default new TransferService();
