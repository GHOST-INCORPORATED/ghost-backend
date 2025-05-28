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
  TransferData,
} from "../types";

export class WebhookController {
  constructor() {
    this.handlePaystackWebhook = this.handlePaystackWebhook.bind(this);
  }

  /**
   * Handle Paystack webhook events
   */
  async handlePaystackWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("[Webhook] Received Paystack webhook");

      const event: PaystackWebhookEvent = req.body;

      // Check signature only for charge events
      if (event.event.startsWith("charge.")) {
        const signature = req.headers["x-paystack-signature"] as string;
        logger.info("[Webhook] Signature header:", signature);

        if (!signature || !verifyPaystackSignature(signature, req.body)) {
          logger.warn("Invalid Paystack webhook signature");
          res.status(403).send("Invalid signature");
          return;
        }
      } else {
        // For transfer events and others, optionally log missing signature
        logger.info(
          "[Webhook] Skipping signature verification for event:",
          event.event
        );
      }

      logger.info("[Webhook] Event payload:", JSON.stringify(event));

      switch (event.event) {
        case "charge.success":
          await this.handleChargeSuccess(event as PaystackChargeEvent);
          break;

        case "transfer.success":
          await this.handleTransferSuccess(event as PaystackTransferEvent);
          break;

        case "transfer.failed":
          await this.handleTransferFailed(event as PaystackTransferEvent);
          break;

        case "transfer.pending":
          await this.handleTransferPending(event as PaystackTransferEvent);
          break;

        case "transferrequest.approval-required":
          await this.handleTransferApprovalRequired(event);
          break;

        default:
          logger.warn("Unhandled Paystack webhook event:", event.event);
      }

      res.status(200).send("Webhook processed");
    } catch (error) {
      logger.error("Webhook processing error:", { error });
      res.status(500).send("Internal Server Error");
    }
  }

  /**
   * Handle "transferrequest.approval-required" event
   * This event indicates Paystack needs approval for a transfer request.
   */
  private async handleTransferApprovalRequired(event: any) {
    try {
      const reference = event.data?.transfers?.[0]?.reference;

      logger.info("Transfer approval required event received:", { reference });

      if (!reference) {
        logger.warn(
          "Transfer approval required event missing transfer reference"
        );
        return;
      }

      logger.info("Approving transfer request for reference:", { reference });

      // Update withdrawal status to paid
      const { escrowId } = await transferService.updateWithdrawalStatus(
        reference,
        WithdrawalStatus.PAID,
        "Transfer request has been approved"
      );

      // Update escrow status to released
      await escrowService.updateEscrowStatus(escrowId, EscrowStatus.RELEASED, {
        sellerWithdrawn: true,
        withdrawnAt: new Date() as any,
      });

      logger.info("Transfer request approved", { reference });
    } catch (error) {
      logger.error("Error handling transfer approval required webhook:", {
        error,
      });
    }
  }

  private async handleChargeSuccess(event: PaystackChargeEvent) {
    const { reference } = event.data;

    try {
      await paymentService.updatePaymentStatus(
        reference,
        PaymentStatus.SUCCESS
      );
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

  private async handleTransferSuccess(event: PaystackTransferEvent) {
    const { reference } = event.data;

    try {
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

  private async handleTransferFailed(event: PaystackTransferEvent) {
    const { reference, failures } = event.data;
    const failureReason = failures?.reason || "Unknown reason";

    try {
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

  /**
   * Handle transfer pending (requires approval)
   */
  private async handleTransferPending(event: PaystackTransferEvent) {
    const { reference } = event.data;

    try {
      logger.info("Approving pending transfer", { reference });

      // Call internal service to approve transfer
      await transferService.approveTransfer(reference);

      logger.info("Transfer approved", { reference });
    } catch (error) {
      logger.error("Error approving pending transfer:", { error, reference });
    }
  }
}

export default new WebhookController();
