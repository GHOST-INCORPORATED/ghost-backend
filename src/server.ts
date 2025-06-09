import dotenv from "dotenv";
import express, { Request, Response, RequestHandler } from "express";
import { ServerClient } from "postmark";
import cors from "cors";
import validator from "validator";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const POSTMARK_LIVE_TOKEN = process.env.POSTMARK_SERVER_TOKEN;

if (!POSTMARK_LIVE_TOKEN) {
  console.error("❌ POSTMARK_SERVER_TOKEN is required for live mode");
  console.error(
    "💡 Make sure your .env file contains: POSTMARK_SERVER_TOKEN=your_live_token"
  );
  process.exit(1);
}

const client = new ServerClient(POSTMARK_LIVE_TOKEN);
console.log("✅ Postmark LIVE client initialized successfully");

type EmailType = "finance" | "updates" | "support" | "noreply";

const EMAIL_CONFIG = {
  supportEmail: "support@ghostplay.store",
  financeEmail: "finance@ghostplay.store",
  updatesEmail: "updates@ghostplay.store",
  noreplyEmail: "noreply@ghostplay.store",

  getFromEmail: (emailType?: EmailType): string => {
    switch (emailType) {
      case "finance":
        return "finance@ghostplay.store";
      case "updates":
        return "updates@ghostplay.store";
      case "noreply":
      case "support":
      default:
        return "support@ghostplay.store"; // Support handles noreply functions
    }
  },
};

interface EmailRequest {
  from?: string;
  to: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  trackOpens?: boolean;
  emailType?: EmailType;
}

interface InboundEmailRequest {
  From: string;
  To: string;
  Subject: string;
  TextBody?: string;
  HtmlBody?: string;
  receivedDate: string;
}

const sendEmailHandler: RequestHandler<{}, any, EmailRequest, any> = async (
  req,
  res
) => {
  const { from, to, subject, htmlBody, textBody, trackOpens, emailType } =
    req.body;

  if (!to || !subject) {
    res.status(400).json({
      success: false,
      message: "Missing required fields: 'to' and 'subject' are required.",
    });
    return;
  }

  if (!validator.isEmail(to)) {
    res
      .status(400)
      .json({ success: false, message: "Invalid recipient email address." });
    return;
  }

  let senderEmail =
    from && validator.isEmail(from)
      ? from
      : EMAIL_CONFIG.getFromEmail(emailType || "support");

  try {
    console.log(`[LIVE] Sending email to ${to} with subject: ${subject}`);
    console.log(
      `[LIVE] From: ${senderEmail} (Type: ${emailType || "default"})`
    );

    const emailPayload = {
      From: senderEmail,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      TrackOpens: trackOpens !== false,
      MessageStream: "outbound",
      Headers: [
        { Name: "X-Email-Type", Value: emailType || "general" },
        { Name: "X-Service", Value: "GhostPlay-Marketplace" },
      ],
    };

    const response = await client.sendEmail(emailPayload);

    console.log("[LIVE] Email sent successfully:", {
      from: senderEmail,
      to,
      subject,
      messageId: response.MessageID,
      emailType: emailType || "default",
    });

    res.json({
      success: true,
      messageId: response.MessageID,
      to,
      from: senderEmail,
      subject,
      mode: "LIVE",
      emailType: emailType || "default",
      liveMode: true,
      message: "Email sent successfully in LIVE mode",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[LIVE ERROR] Email error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to send email: ${errorMessage}`,
      mode: "LIVE",
      emailType: emailType || "default",
      liveMode: true,
    });
  }
};

const inboundEmailHandler: RequestHandler<
  {},
  any,
  InboundEmailRequest,
  any
> = async (req, res) => {
  const { From, To, Subject, TextBody, HtmlBody, receivedDate } = req.body;

  if (!From || !Subject) {
    res.status(400).json({
      success: false,
      message: "Missing required fields in inbound email",
    });
    return;
  }

  try {
    const emailBody = TextBody || HtmlBody || "No content";
    const receivedAt = receivedDate
      ? new Date(receivedDate).toLocaleString("en-US", {
          timeZone: "Africa/Lagos",
        })
      : new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" });

    let routingInfo = "General Support";
    if (To.includes("finance@")) routingInfo = "Finance Department";
    else if (To.includes("updates@")) routingInfo = "Updates Department";
    else if (To.includes("noreply@"))
      routingInfo = "No-Reply (routed to Support)";

    console.log(`[LIVE] Processing inbound email - Routing: ${routingInfo}`);

    const forwardResponse = await client.sendEmail({
      From: EMAIL_CONFIG.supportEmail,
      To: EMAIL_CONFIG.supportEmail,
      Subject: `[LIVE] [INBOUND] ${routingInfo}: ${Subject}`,
      TextBody: `
INBOUND EMAIL ROUTING INFORMATION
================================
Original To: ${To}
Routing: ${routingInfo}
From: ${From}
Received: ${receivedAt}
Mode: LIVE
Original Subject: ${Subject}

--- ORIGINAL MESSAGE ---
${emailBody}
      `,
      HtmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; color: white; padding: 10px; margin-bottom: 20px; border-radius: 4px;"><strong>🚀 LIVE EMAIL</strong></div>
          <h2>📬 Inbound Email - ${routingInfo}</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p><strong>Original To:</strong> ${To}</p>
            <p><strong>From:</strong> ${From}</p>
            <p><strong>Received:</strong> ${receivedAt}</p>
            <p><strong>Mode:</strong> LIVE</p>
            <p><strong>Routing:</strong> ${routingInfo}</p>
          </div>
          <h3>Original Subject: ${Subject}</h3>
          <hr>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${
              HtmlBody ||
              `<pre style="white-space: pre-wrap;">${
                TextBody || "No content"
              }</pre>`
            }
          </div>
        </div>
      `,
      TrackOpens: true,
      MessageStream: "outbound",
      Headers: [
        { Name: "X-Email-Type", Value: "inbound-forward" },
        { Name: "X-Original-To", Value: To },
        { Name: "X-Routing-Info", Value: routingInfo },
      ],
    });

    console.log(
      "[LIVE] Inbound email forwarded to support:",
      forwardResponse.MessageID
    );

    res.status(200).json({
      success: true,
      message: "Inbound email processed and forwarded to support (LIVE mode)",
      mode: "LIVE",
      routing: routingInfo,
      originalTo: To,
      forwardedTo: EMAIL_CONFIG.supportEmail,
      liveMode: true,
      messageId: forwardResponse.MessageID,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[LIVE ERROR] Error processing inbound email:", error);
    res.status(500).json({
      success: false,
      message: `Failed to process inbound email: ${errorMessage}`,
      mode: "LIVE",
      liveMode: true,
    });
  }
};

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    timezone: "Africa/Lagos",
    mode: "LIVE",
    liveMode: true,
    clientInitialized: true,
    emailConfiguration: {
      supportEmail: EMAIL_CONFIG.supportEmail,
      financeEmail: EMAIL_CONFIG.financeEmail,
      updatesEmail: EMAIL_CONFIG.updatesEmail,
      noreplyHandledBy: EMAIL_CONFIG.supportEmail,
      routingActive: true,
    },
    environmentVars: { HAS_LIVE_TOKEN: !!POSTMARK_LIVE_TOKEN },
  });
});

app.get("/api/email/config", (req, res) => {
  res.json({
    mode: "LIVE",
    emailRouting: {
      support: EMAIL_CONFIG.supportEmail,
      finance: EMAIL_CONFIG.financeEmail,
      updates: EMAIL_CONFIG.updatesEmail,
      noreply: `${EMAIL_CONFIG.noreplyEmail} (handled by ${EMAIL_CONFIG.supportEmail})`,
    },
    routingExamples: {
      "emailType: 'finance'": EMAIL_CONFIG.getFromEmail("finance"),
      "emailType: 'updates'": EMAIL_CONFIG.getFromEmail("updates"),
      "emailType: 'noreply'": EMAIL_CONFIG.getFromEmail("noreply"),
      "emailType: 'support' or default": EMAIL_CONFIG.getFromEmail("support"),
    },
  });
});

app.post("/api/email/send", sendEmailHandler);
app.post("/api/email/inbound-email", inboundEmailHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 LIVE MODE Email server running on port ${PORT}`);
  console.log("📧 Email service active (LIVE mode)");
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚙️ Email config: http://localhost:${PORT}/api/email/config`);
  console.log("📬 Email routing configured:");
  console.log("   • support@ghostplay.store (handles noreply functions)");
  console.log("   • finance@ghostplay.store (financial transactions)");
  console.log("   • updates@ghostplay.store (notifications & updates)");
  console.log("   • Inbound emails automatically routed to support");
});