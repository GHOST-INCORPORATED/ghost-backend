// src/services/escrow.service.ts
import { db } from "../config/firebase";
import { EscrowRecord, EscrowStatus, CreateEscrowRequest } from "../types";
import { generateRandomId } from "../utils/crypto";
import logger from "../utils/logger";
import { AppError } from "../middlewares/error";

export class EscrowService {
  /**
   * Create a new escrow
   * @param buyerId Buyer's user ID
   * @param data Escrow data
   */
  async createEscrow(
    buyerId: string,
    data: CreateEscrowRequest
  ): Promise<EscrowRecord> {
    try {
      const escrowId = generateRandomId();
      const reference = `escrow_${generateRandomId(15)}`;
      const now = new Date();

      const escrow: EscrowRecord = {
        id: escrowId,
        buyerId,
        sellerId: data.sellerId,
        amount: data.amount,
        description: data.description,
        status: EscrowStatus.AWAITING_PAYMENT,
        reference,
        createdAt: now as any, // Firestore will convert to Timestamp
        updatedAt: now as any,
        paymentVerified: false,
        sellerWithdrawn: false,
        withdrawnAt: null,
      };

      await db.collection("escrows").doc(escrowId).set(escrow);
      return escrow;
    } catch (error: any) {
      logger.error("Create escrow error:", { error: error.message });
      throw new AppError("Failed to create escrow", 500);
    }
  }

  /**
   * Get escrow by ID
   * @param escrowId Escrow ID
   */
  async getEscrowById(escrowId: string): Promise<EscrowRecord | null> {
    try {
      const escrowDoc = await db.collection("escrows").doc(escrowId).get();

      if (!escrowDoc.exists) {
        return null;
      }

      return escrowDoc.data() as EscrowRecord;
    } catch (error: any) {
      logger.error("Get escrow error:", { error: error.message, escrowId });
      throw new AppError("Failed to retrieve escrow", 500);
    }
  }

  /**
   * Update escrow status
   * @param escrowId Escrow ID
   * @param status New status
   * @param additionalData Additional data to update
   */
  async updateEscrowStatus(
    escrowId: string,
    status: EscrowStatus,
    additionalData: Partial<EscrowRecord> = {}
  ): Promise<void> {
    try {
      const escrowRef = db.collection("escrows").doc(escrowId);
      const escrowDoc = await escrowRef.get();

      if (!escrowDoc.exists) {
        throw new AppError("Escrow not found", 404);
      }

      await escrowRef.update({
        status,
        updatedAt: new Date(),
        ...additionalData,
      });
    } catch (error: any) {
      logger.error("Update escrow status error:", {
        error: error.message,
        escrowId,
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update escrow status", 500);
    }
  }

  /**
   * Get escrows by buyer ID
   * @param buyerId Buyer's user ID
   */
  async getEscrowsByBuyerId(buyerId: string): Promise<EscrowRecord[]> {
    try {
      const escrowsRef = db.collection("escrows");
      const querySnapshot = await escrowsRef
        .where("buyerId", "==", buyerId)
        .get();

      return querySnapshot.docs.map((doc) => doc.data() as EscrowRecord);
    } catch (error: any) {
      logger.error("Get buyer escrows error:", {
        error: error.message,
        buyerId,
      });
      throw new AppError("Failed to retrieve escrows", 500);
    }
  }

  /**
   * Get escrows by seller ID
   * @param sellerId Seller's user ID
   */
  async getEscrowsBySellerId(sellerId: string): Promise<EscrowRecord[]> {
    try {
      const escrowsRef = db.collection("escrows");
      const querySnapshot = await escrowsRef
        .where("sellerId", "==", sellerId)
        .get();

      return querySnapshot.docs.map((doc) => doc.data() as EscrowRecord);
    } catch (error: any) {
      logger.error("Get seller escrows error:", {
        error: error.message,
        sellerId,
      });
      throw new AppError("Failed to retrieve escrows", 500);
    }
  }
}

export default new EscrowService();
