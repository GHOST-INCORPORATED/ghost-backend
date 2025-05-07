// src/routes/user.routes.ts
import { Router } from "express";
import { userController } from "../controllers";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import { body } from "express-validator";

const router = Router();

// All routes require authentication
// router.use(authenticate);

// Set bank details
router.post(
  "/bank-details",
  validate([
    body("bankAccountNumber")
      .notEmpty()
      .withMessage("Bank account number is required"),
    body("bankCode").notEmpty().withMessage("Bank code is required"),
    body("fullName").notEmpty().withMessage("Full name is required"),
  ]),
  userController.setBankDetails
);

export default router;
