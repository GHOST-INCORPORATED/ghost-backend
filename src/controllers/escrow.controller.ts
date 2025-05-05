// src/controllers/escrow.controller.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { escrowService, transferService } from "../services";
import { successResponse, errorResponse } from "../utils/response";
import {
  CreateEscrowRequest,
  EscrowStatus,
  ProcessWithdrawalRequest,
} from "../types";
import { db } from "../config/firebase";

export class EscrowController {
  /**
   * Create a new escrow
   */
  async createEscrow(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { sellerId, amount, description } = req.body as CreateEscrowRequest;
      const buyerId = req.userId as string;

      const escrowData: CreateEscrowRequest = {
        sellerId,
        amount: Number(amount),
        description,
      };

      const escrow = await escrowService.createEscrow(buyerId, escrowData);

      successResponse(res, escrow, "Escrow created successfully", 201);
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get escrow by ID
   */
  async getEscrow(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { escrowId } = req.params;
      const userId = req.userId as string;

      const escrow = await escrowService.getEscrowById(escrowId);

      if (!escrow) {
        errorResponse(res, "Escrow not found", 404);
        return;
      }

      // Check if user is authorized to view this escrow
      if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
        errorResponse(res, "Unauthorized to view this escrow", 403);
        return;
      }

      successResponse(res, escrow, "Escrow fetched successfully");
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all escrows for the current user (as buyer or seller)
   */
  async getAllEscrows(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId as string;
      const { role } = req.query;

      let escrows;
      if (role === "seller") {
        escrows = await escrowService.getEscrowsBySellerId(userId);
      } else if (role === "buyer") {
        escrows = await escrowService.getEscrowsByBuyerId(userId);
      } else {
        // Get both buyer and seller escrows
        const buyerEscrows = await escrowService.getEscrowsByBuyerId(userId);
        const sellerEscrows = await escrowService.getEscrowsBySellerId(userId);
        escrows = [...buyerEscrows, ...sellerEscrows];
      }

      successResponse(res, escrows, "Escrows fetched successfully");
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm escrow completion by buyer
   */
  async confirmEscrow(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { escrowId } = req.params;
      const userId = req.userId as string;

      const escrow = await escrowService.getEscrowById(escrowId);

      if (!escrow) {
        errorResponse(res, "Escrow not found", 404);
        return;
      }

      // Check if user is the buyer
      if (escrow.buyerId !== userId) {
        errorResponse(res, "Only the buyer can confirm this escrow", 403);
        return;
      }

      // Check if escrow is in the right state
      if (escrow.status !== EscrowStatus.AWAITING_FEEDBACK) {
        errorResponse(
          res,
          `Cannot confirm escrow in '${escrow.status}' status`,
          400
        );
        return;
      }

      // Update escrow status
      await escrowService.updateEscrowStatus(
        escrowId,
        EscrowStatus.BUYER_CONFIRMED
      );

      successResponse(res, { escrowId }, "Escrow confirmed successfully");
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process withdrawal for seller
   */
  async processWithdrawal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId as string;
      const { escrowId } = req.body as ProcessWithdrawalRequest;

      // Get the escrow
      const escrow = await escrowService.getEscrowById(escrowId);

      if (!escrow) {
        errorResponse(res, "Escrow not found", 404);
        return;
      }

      // Check if user is the seller
      if (escrow.sellerId !== userId) {
        errorResponse(res, "Only the seller can withdraw funds", 403);
        return;
      }

      // Check if escrow is in the right state
      if (escrow.status !== EscrowStatus.BUYER_CONFIRMED) {
        errorResponse(
          res,
          `Cannot withdraw from escrow in '${escrow.status}' status`,
          400
        );
        return;
      }

      // Check if already withdrawn
      if (escrow.sellerWithdrawn) {
        errorResponse(res, "Funds already withdrawn", 400);
        return;
      }

      // Get seller's recipient code
      const sellerDoc = await db.collection("users").doc(userId).get();
      if (!sellerDoc.exists) {
        errorResponse(res, "Seller profile not found", 404);
        return;
      }

      const sellerData = sellerDoc.data();
      if (!sellerData?.paystackRecipientCode) {
        errorResponse(res, "Seller bank details not set", 400);
        return;
      }

      // Create withdrawal record
      const withdrawal = await transferService.initiateWithdrawal(
        escrowId,
        userId,
        escrow.amount,
        sellerData.paystackRecipientCode
      );

      // Process the withdrawal
      const result = await transferService.processWithdrawal(
        escrowId,
        withdrawal.id,
        sellerData.paystackRecipientCode,
        escrow.amount
      );

      // Update escrow status if transfer was successful
      if (result.status === "success") {
        await escrowService.updateEscrowStatus(
          escrowId,
          EscrowStatus.RELEASED,
          {
            sellerWithdrawn: true,
            withdrawnAt: new Date() as any,
          }
        );
      }

      successResponse(
        res,
        {
          withdrawalId: withdrawal.id,
          transferCode: result.transferCode,
          status: result.status,
        },
        "Withdrawal processed successfully"
      );
      return;
    } catch (error) {
      next(error);
    }
  }
}

export default new EscrowController();
