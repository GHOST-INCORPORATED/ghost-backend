// src/config/index.ts
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  gmail: {
    user: process.env.GMAIL_USER!,
    appPassword: process.env.GMAIL_APP_PASSWORD!,
  },
  zeptomail: {
    url: process.env.ZEPTOMAIL_API_URL || "api.zeptomail.com/",
    token: process.env.ZEPTOMAIL_TOKEN || "",
    senderEmail: process.env.ZEPTOMAIL_SENDER_EMAIL || "noreply@yourdomain.com",
    senderName: process.env.ZEPTOMAIL_SENDER_NAME || "Your App Name",
  },
  // Add other configuration sections as needed
};
