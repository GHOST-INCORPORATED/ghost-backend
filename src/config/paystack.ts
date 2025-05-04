import dotenv from "dotenv";

dotenv.config();

export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;
export const PAYSTACK_WEBHOOK_SECRET = process.env
  .PAYSTACK_WEBHOOK_SECRET as string;

if (!PAYSTACK_SECRET_KEY || !PAYSTACK_WEBHOOK_SECRET) {
  throw new Error("Paystack configuration missing");
}

export const PAYSTACK_API_URL = "https://api.paystack.co";
