// src/routes/escrow.routes.ts
import { Router } from "express";
import { escrowController } from "../controllers";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import { body, param } from "express-validator";

const router = Router();

// Middleware to validate escrow creation
const validateCreateEscrow = [
  body("sellerId").notEmpty().withMessage("Seller ID is required"),
  body("amount")
    .isNumeric()
    .withMessage("Amount must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
  body("description").notEmpty().withMessage("Description is required"),
];

// Middleware to validate escrow ID parameter
const validateEscrowId = [
  param("escrowId").notEmpty().withMessage("Escrow ID is required"),
];

// All routes require authentication
router.use(authenticate);

// Create a new escrow
router.post(
  "/",
  validate(validateCreateEscrow),
  escrowController.createEscrow.bind(escrowController)
);

// Get all escrows for current user
router.get("/", escrowController.getAllEscrows.bind(escrowController));

// Get specific escrow by ID
router.get(
  "/:escrowId",
  validate(validateEscrowId),
  escrowController.getEscrow.bind(escrowController)
);

// Confirm escrow completion (buyer)
router.post(
  "/:escrowId/confirm",
  validate(validateEscrowId),
  escrowController.confirmEscrow.bind(escrowController)
);

// Process withdrawal (seller)
router.post(
  "/withdraw",
  body("escrowId").notEmpty().withMessage("Escrow ID is required"),
  escrowController.processWithdrawal.bind(escrowController)
);

export default router;
