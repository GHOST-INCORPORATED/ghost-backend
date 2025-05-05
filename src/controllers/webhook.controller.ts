// src/controllers/webhook.controller.ts
import { Request, Response, NextFunction } from "express";
import { verifyPaystackSignature } from "../utils/crypto";
import { paymentService, escrowService, transferService } from "../services";
import logger from "../utils/logger";
import {
  PaystackWebhookEvent,
  PaystackChargeEvent,
  PaystackTransferEvent,
  EscrowStatus,
  PaymentStatus,
  WithdrawalStatus,
} from "../types";

export class WebhookController {
  /**
   * Handle Paystack webhook events
   */
  async handlePaystackWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Verify signature
      const signature = req.headers["x-paystack-signature"] as string;

      if (!signature || !verifyPaystackSignature(signature, req.body)) {
        logger.warn("Invalid Paystack webhook signature");
        res.status(403).send("Invalid signature");
        return;
      }

      const event: PaystackWebhookEvent = req.body;

      // Handle charge events (payments)
      if (event.event === "charge.success") {
        await this.handleChargeSuccess(event as PaystackChargeEvent);
      }

      // Handle transfer events (withdrawals)
      else if (event.event === "transfer.success") {
        await this.handleTransferSuccess(event as PaystackTransferEvent);
      }

      // Handle transfer failure
      else if (event.event === "transfer.failed") {
        await this.handleTransferFailed(event as PaystackTransferEvent);
      }

      // Return 200 for any event to acknowledge receipt
      res.status(200).send("Webhook processed");
      return;
    } catch (error) {
      logger.error("Webhook processing error:", { error });
      res.status(500).send("Internal Server Error");
      return;
    }
  }

  /**
   * Handle successful payment
   */
  private async handleChargeSuccess(event: PaystackChargeEvent) {
    const paymentData = event.data;
    const reference = paymentData.reference;

    try {
      // Verify payment again
      const verifiedPayment = await paymentService.verifyPaystackPayment(
        reference
      );

      if (verifiedPayment.status !== "success") {
        throw new Error("Payment verification failed");
      }

      // Update payment status
      await paymentService.updatePaymentStatus(
        reference,
        PaymentStatus.SUCCESS
      );

      // Get payment record to find escrow
      const payment = await paymentService.getPaymentByReference(reference);

      if (!payment) {
        throw new Error("Payment record not found");
      }

      // Update escrow status
      await escrowService.updateEscrowStatus(
        payment.escrowId,
        EscrowStatus.AWAITING_FEEDBACK,
        {
          paymentVerified: true,
        }
      );

      logger.info("Payment processed successfully", { reference });
    } catch (error) {
      logger.error("Error processing payment webhook:", { error, reference });
    }
  }

  /**
   * Handle successful transfer
   */
  private async handleTransferSuccess(event: PaystackTransferEvent) {
    const transferData = event.data;
    const reference = transferData.reference;

    try {
      // Update withdrawal status
      await transferService.updateWithdrawalStatus(
        reference,
        WithdrawalStatus.PAID
      );

      logger.info("Transfer processed successfully", { reference });
    } catch (error) {
      logger.error("Error processing transfer success webhook:", {
        error,
        reference,
      });
    }
  }

  /**
   * Handle failed transfer
   */
  private async handleTransferFailed(event: PaystackTransferEvent) {
    const transferData = event.data;
    const reference = transferData.reference;
    const failureReason = transferData.failures?.reason || "Unknown reason";

    try {
      // Update withdrawal status
      await transferService.updateWithdrawalStatus(
        reference,
        WithdrawalStatus.FAILED,
        `Transfer failed: ${failureReason}`
      );

      logger.warn("Transfer failed", { reference, reason: failureReason });
    } catch (error) {
      logger.error("Error processing transfer failure webhook:", {
        error,
        reference,
      });
    }
  }
}

export default new WebhookController();
