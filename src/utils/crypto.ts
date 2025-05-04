import crypto from "crypto";
import { PAYSTACK_WEBHOOK_SECRET } from "../config/paystack";

export const generateRandomId = (length = 10): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

export const verifyPaystackSignature = (
  signature: string,
  payload: any
): boolean => {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  return hash === signature;
};
