// src/routes/webhook.routes.ts
import { Router } from "express";
import { webhookController } from "../controllers";

const router = Router();

// Webhook endpoint - no authentication required (uses signatures instead)
router.post("/paystack", webhookController.handlePaystackWebhook);

export default router;
