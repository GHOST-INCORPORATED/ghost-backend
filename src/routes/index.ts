// src/routes/index.ts
import { Router } from "express";
import escrowRoutes from "./escrow.routes";
import paymentRoutes from "./payment.routes";
import userRoutes from "./users.routes";
import webhookRoutes from "./webhook.routes";
import emailRouter from "./emails.routes";

const router = Router();
// Mount routes
router.use("/escrows", escrowRoutes);
router.use("/payments", paymentRoutes);
router.use("/users", userRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/email", emailRouter);

export default router;
