// src/routes/escrow.routes.ts
import { Router } from "express";
import { escrowController } from "../controllers";
import { authenticate } from "../middlewares/auth";
import { body, param } from "express-validator";

const router = Router();

// All routes require authentication
// router.use(authenticate);

// Process withdrawal (seller)
/**
 * @openapi
 * /escrows/withdraw:
 *   post:
 *     summary: Process withdrawal
 */
router.post(
  "/withdraw",
  body("escrowId").notEmpty().withMessage("Escrow ID is required"),
  escrowController.processWithdrawal
);

export default router;
