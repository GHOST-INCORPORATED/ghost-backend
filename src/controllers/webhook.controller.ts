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
  constructor() {
    // make sure all methods stay bound to this instance
    this.handlePaystackWebhook = this.handlePaystackWebhook.bind(this);
  }
  /**
   * Handle Paystack webhook events
   */
  async handlePaystackWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("[Webhook] Received Paystack webhook");
      // Verify signature
      const signature = req.headers["x-paystack-signature"] as string;
      console.log("[Webhook] Signature header:", signature);

      if (!signature || !verifyPaystackSignature(signature, req.body)) {
        console.log("[Webhook] Invalid or missing signature");
        logger.warn("Invalid Paystack webhook signature");
        res.status(403).send("Invalid signature");
        return;
      }

      const event: PaystackWebhookEvent = req.body;
      console.log("[Webhook] Event payload:", JSON.stringify(event));

      // Handle charge events (payments)
      if (event.event === "charge.success") {
        console.log("[Webhook] Handling charge.success event");
        await this.handleChargeSuccess(event as PaystackChargeEvent);
      }

      // Handle transfer events (withdrawals)
      else if (event.event === "transfer.success") {
        console.log("[Webhook] Handling transfer.success event");
        await this.handleTransferSuccess(event as PaystackTransferEvent);
      }

      // Handle transfer failure
      else if (event.event === "transfer.failed") {
        console.log("[Webhook] Handling transfer.failed event");
        await this.handleTransferFailed(event as PaystackTransferEvent);
      }

      console.log("[Webhook] Successfully processed event:", event.event);
      res.status(200).send("Webhook processed");
      return;
    } catch (error) {
      console.log("[Webhook] Processing error:", error);
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
      logger.info("Updating Payment record");
      // Update payment status
      await paymentService.updatePaymentStatus(
        reference,
        PaymentStatus.SUCCESS
      );

      logger.info("Updating Escrow record");
      // Update escrow status
      await escrowService.updateEscrowStatus(
        reference,
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
