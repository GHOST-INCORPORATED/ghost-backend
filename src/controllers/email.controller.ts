// src/controllers/email.controller.ts
import { Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";
import logger from "../utils/logger";
import { config } from "../config/zepto";
import { EmailSendRequest } from "../types/emails.types";

export class EmailController {
  private transporter;

  constructor() {
    // Initialize Gmail SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.gmail.user, // Gmail address from config
        pass: config.gmail.appPassword, // App password (or OAuth2)
      },
    });

    this.sendEmail = this.sendEmail.bind(this);
  }

  /**
   * Send a regular email using Gmail SMTP
   */
  async sendEmail(
    req: Request<{}, {}, EmailSendRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info("Received email send request");

      const { to, subject, textBody, htmlBody } = req.body;

      if (!to || !subject || (!textBody && !htmlBody)) {
        logger.warn("Missing required email fields");
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: to, subject, and either textBody or htmlBody",
        });
        return;
      }

      // Setup sender
      const senderName = config.zeptomail.senderName;
      const senderEmail = config.zeptomail.senderEmail;

      // Format recipients
      const formatRecipients = (list: any[]) =>
        list.map((r) => `"${r.name || ""}" <${r.email}>`).join(", ");

      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to: Array.isArray(to) ? formatRecipients(to) : `"${to || ""}" <${to}>`,
        subject,
        html: htmlBody || undefined,
        text: textBody || undefined,
        headers: {
          "X-Client-Reference": `email-${Date.now()}`,
        },
      };

      logger.info("Sending email", { to: mailOptions.to, subject });
      const info = await this.transporter.sendMail(mailOptions);

      logger.info("Email sent successfully");
      res.status(200).json({
        success: true,
        message: "Email sent successfully",
        data: info,
      });
    } catch (error: any) {
      logger.error("Error sending email:", { error });
      res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: error.message,
      });
    }
  }
}

export default new EmailController();
