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
   * Process withdrawal for seller
   */
  /**
   * @openapi
   * /escrows/withdraw:
   *   post:
   *     summary: Process withdrawal for seller
   *     tags:
   *       - Escrow
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProcessWithdrawalRequest'
   *     responses:
   *       '200':
   *         description: Withdrawal processed successfully
   *       '400':
   *         description: Invalid request or escrow status
   *       '403':
   *         description: Only the seller can withdraw funds
   *       '404':
   *         description: Escrow or seller profile not found
   */
  async processWithdrawal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { escrowId, userId } = req.body;
      console.table(req.body);

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
