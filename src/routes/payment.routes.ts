// src/routes/payment.routes.ts
import { Router } from "express";
import { paymentController } from "../controllers";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import { param } from "express-validator";

const router = Router();

// All routes except webhook verification require authentication
router.use(authenticate);

// Initialize payment for an escrow
router.post(
  "/:escrowId/initialize",
  validate([param("escrowId").notEmpty().withMessage("Escrow ID is required")]),
  paymentController.initializePayment
);

// Verify payment status
router.get(
  "/verify/:reference",
  validate([
    param("reference").notEmpty().withMessage("Reference is required"),
  ]),
  paymentController.verifyPayment
);

export default router;
