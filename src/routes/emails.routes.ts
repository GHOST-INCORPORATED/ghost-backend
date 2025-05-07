// src/routes/email.routes.ts
import { Router } from "express";
import emailController from "../controllers/email.controller";

const router = Router();

/**
 * @route POST /api/email/send
 * @desc Send a regular email
 * @access Private
 */
router.post("/send", emailController.sendEmail);

export default router;
