// src/controllers/payment.controller.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { escrowService, paymentService } from "../services";
import { successResponse, errorResponse } from "../utils/response";
import { EscrowStatus, PaymentStatus } from "../types";

export class PaymentController {
  /**
   * Initialize payment for an escrow
   */
  async initializePayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { escrowId } = req.params;
      const userId = req.userId as string;

      // Get the escrow
      const escrow = await escrowService.getEscrowById(escrowId);

      if (!escrow) {
        errorResponse(res, "Escrow not found", 404);
        return;
      }

      // Check if user is the buyer
      if (escrow.buyerId !== userId) {
        errorResponse(res, "Only the buyer can make payment", 403);
        return;
      }

      // Check if escrow is in the right state
      if (escrow.status !== EscrowStatus.AWAITING_PAYMENT) {
        errorResponse(
          res,
          `Cannot make payment for escrow in '${escrow.status}' status`,
          400
        );
        return;
      }

      // Create payment record
      const payment = await paymentService.createPayment({
        escrowId,
        userId,
        amount: escrow.amount,
        reference: escrow.reference,
        paymentMethod: "paystack",
      });

      // In a real implementation, you would initialize Paystack payment here
      // and return the authorization URL to the client

      successResponse(
        res,
        {
          paymentId: payment.id,
          reference: payment.reference,
          amount: payment.amount,
          // authorization_url: would come from Paystack
        },
        "Payment initialized successfully"
      );
      return;
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { reference } = req.params;

      // Verify with Paystack
      const verifiedPayment = await paymentService.verifyPaystackPayment(
        reference
      );

      if (verifiedPayment.status !== "success") {
        errorResponse(res, "Payment verification failed", 400);
        return;
      }

      // Update payment record
      await paymentService.updatePaymentStatus(
        reference,
        PaymentStatus.SUCCESS
      );

      // Get payment record to find escrow
      const payment = await paymentService.getPaymentByReference(reference);

      if (!payment) {
        errorResponse(res, "Payment record not found", 404);
        return;
      }

      // Update escrow status
      await escrowService.updateEscrowStatus(
        payment.escrowId,
        EscrowStatus.AWAITING_FEEDBACK,
        {
          paymentVerified: true,
        }
      );

      successResponse(
        res,
        {
          reference,
          status: verifiedPayment.status,
        },
        "Payment verified successfully"
      );
      return;
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
