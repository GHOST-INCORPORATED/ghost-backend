import dotenv from "dotenv";
import express, { Request, Response, RequestHandler } from "express";
import { ServerClient } from "postmark";
import cors from "cors";
import validator from "validator";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Determine the mode based on environment variables
const IS_FULL_SIMULATION = process.env.POSTMARK_FULL_SIMULATION === "true";
const IS_POSTMARK_TEST_MODE =
  process.env.POSTMARK_TEST_MODE === "true" || process.env.NODE_ENV === "test";
const IS_LIVE_MODE = !IS_FULL_SIMULATION && !IS_POSTMARK_TEST_MODE;

// Postmark tokens
const POSTMARK_LIVE_TOKEN = process.env.POSTMARK_SERVER_TOKEN;
const POSTMARK_TEST_TOKEN = "POSTMARK_API_TEST"; // Postmark's official test token

// Determine which mode we're running in
let currentMode: "SIMULATION" | "TEST" | "LIVE";
let client: ServerClient | null = null;

if (IS_FULL_SIMULATION) {
  currentMode = "SIMULATION";
  console.log("🧪 Running in FULL SIMULATION mode - all emails will be mocked");
  console.log("📧 No actual Postmark API calls will be made");
} else if (IS_POSTMARK_TEST_MODE) {
  currentMode = "TEST";
  console.log(
    "🧪 Running in POSTMARK TEST mode - real emails with test headers"
  );
  console.log("📧 Using Postmark test server token");
  try {
    client = new ServerClient(POSTMARK_TEST_TOKEN);
    console.log("✅ Postmark TEST client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Postmark TEST client:", error);
    process.exit(1);
  }
} else {
  currentMode = "LIVE";
  console.log("🚀 Running in POSTMARK LIVE mode - real emails will be sent");
  if (!POSTMARK_LIVE_TOKEN) {
    console.error("❌ POSTMARK_SERVER_TOKEN is required for live mode");
    process.exit(1);
  }
  try {
    client = new ServerClient(POSTMARK_LIVE_TOKEN);
    console.log("✅ Postmark LIVE client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Postmark LIVE client:", error);
    process.exit(1);
  }
}

interface EmailRequest {
  from?: string;
  to: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  trackOpens?: boolean;
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
  const { from, to, subject, htmlBody, textBody, trackOpens } = req.body;

  // Input validation
  if (!to || !subject) {
    res.status(400).json({
      success: false,
      message: "Missing required fields: 'to' and 'subject' are required.",
    });
    return;
  }

  // Email validation
  if (!validator.isEmail(to)) {
    res
      .status(400)
      .json({ success: false, message: "Invalid recipient email address." });
    return;
  }

  if (from && !validator.isEmail(from)) {
    res
      .status(400)
      .json({ success: false, message: "Invalid sender email address." });
    return;
  }

  // Use default sender if none provided
  const senderEmail = from || "support@ghostplay.store";

  try {
    const logPrefix = `[${currentMode}]`;
    console.log(`${logPrefix} Sending email to ${to} with subject: ${subject}`);

    let response;

    if (currentMode === "SIMULATION") {
      // Full simulation mode - mock the response
      const mockMessageId = `sim-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      response = {
        MessageID: mockMessageId,
        SubmittedAt: new Date().toISOString(),
        To: to,
        ErrorCode: 0,
        Message: "OK",
      };

      console.log(`${logPrefix} Email simulated successfully:`, {
        from: senderEmail,
        to: to,
        subject: subject,
        messageId: mockMessageId,
      });
    } else {
      // TEST or LIVE mode - use actual Postmark
      const emailPayload = {
        From: senderEmail,
        To: to,
        Subject: currentMode === "TEST" ? `[TEST] ${subject}` : subject,
        HtmlBody:
          currentMode === "TEST"
            ? `<div style="background: #e7f3ff; padding: 10px; margin-bottom: 20px; border: 1px solid #b3d7ff; border-radius: 4px;">
            <strong>🧪 TEST EMAIL</strong> - This is a test email sent via Postmark's test mode
          </div>${htmlBody || ""}`
            : htmlBody,
        TextBody:
          currentMode === "TEST"
            ? `🧪 TEST EMAIL - This is a test email sent via Postmark's test mode\n\n${
                textBody || ""
              }`
            : textBody,
        TrackOpens: trackOpens !== false,
        MessageStream: "outbound",
      };

      response = await client!.sendEmail(emailPayload);

      console.log(`${logPrefix} Email sent successfully:`, {
        from: senderEmail,
        to: to,
        subject: subject,
        messageId: response.MessageID,
      });
    }

    const successMessage =
      currentMode === "SIMULATION"
        ? `Email simulated successfully. MessageID: ${response.MessageID}`
        : `Email sent successfully in ${currentMode} mode. MessageID: ${response.MessageID}`;

    console.log(successMessage);

    res.json({
      success: true,
      messageId: response.MessageID,
      to: to,
      subject: subject,
      mode: currentMode,
      testMode: currentMode === "TEST",
      simulated: currentMode === "SIMULATION",
      message:
        currentMode === "SIMULATION"
          ? "Email simulated successfully"
          : `Email sent successfully in ${currentMode} mode`,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const logPrefix = `[${currentMode} ERROR]`;
    console.error(`${logPrefix} Email error:`, error);

    res.status(500).json({
      success: false,
      message: `Failed to send email: ${errorMessage}`,
      mode: currentMode,
      testMode: currentMode === "TEST",
      simulated: currentMode === "SIMULATION",
    });
  }
};

const inboundEmailHandler: RequestHandler<
  {},
  any,
  InboundEmailRequest,
  any
> = async (req, res) => {
  const logPrefix = `[${currentMode}]`;
  console.log(
    `${logPrefix} Inbound email received at`,
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
    ":",
    JSON.stringify(req.body, null, 2)
  );

  const { From, To, Subject, TextBody, HtmlBody, receivedDate } = req.body;

  // Validate required fields
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

    const ticketData = {
      from: From,
      to: "support@ghostplay.store",
      subject: `Support Reply: ${Subject}`,
      body: emailBody,
      receivedAt: receivedAt,
    };

    console.log(`${logPrefix} Processing support ticket:`, ticketData);

    let forwardResponse;

    if (currentMode === "SIMULATION") {
      // Simulate the forward response
      forwardResponse = {
        MessageID: `sim-inbound-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        SubmittedAt: new Date().toISOString(),
        To: "support@ghostplay.store",
        ErrorCode: 0,
        Message: "OK",
      };

      console.log(
        `${logPrefix} Inbound email forwarded (simulated):`,
        forwardResponse.MessageID
      );
    } else {
      // Forward the inbound email to support using Postmark (TEST or LIVE mode)
      forwardResponse = await client!.sendEmail({
        From: "support@ghostplay.store",
        To: "support@ghostplay.store",
        Subject: `[${currentMode}] [INBOUND] ${Subject}`,
        TextBody: `New inbound email from: ${From}\nReceived at: ${receivedAt}\nOriginal Subject: ${Subject}\nMode: ${currentMode}\n\n--- MESSAGE ---\n${emailBody}`,
        HtmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${
              currentMode === "TEST"
                ? '<div style="background: #e7f3ff; padding: 10px; margin-bottom: 20px; border: 1px solid #b3d7ff; border-radius: 4px;"><strong>🧪 TEST EMAIL</strong></div>'
                : ""
            }
            <h2>New Inbound Email</h2>
            <p><strong>From:</strong> ${From}</p>
            <p><strong>Received:</strong> ${receivedAt}</p>
            <p><strong>Mode:</strong> ${currentMode}</p>
            <p><strong>Original Subject:</strong> ${Subject}</p>
            <hr>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              ${HtmlBody || `<pre>${TextBody || "No content"}</pre>`}
            </div>
          </div>
        `,
        TrackOpens: true,
        MessageStream: "outbound",
      });
    }

    const successMessage =
      currentMode === "SIMULATION"
        ? "Inbound email processed and forwarded to support (simulated)"
        : `Inbound email processed and forwarded to support (${currentMode} mode)`;

    res.status(200).json({
      success: true,
      message: successMessage,
      mode: currentMode,
      testMode: currentMode === "TEST",
      simulated: currentMode === "SIMULATION",
      messageId: forwardResponse.MessageID,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const logPrefix = `[${currentMode} ERROR]`;
    console.error(`${logPrefix} Error processing inbound email:`, error);

    res.status(500).json({
      success: false,
      message: `Failed to process inbound email: ${errorMessage}`,
      mode: currentMode,
      testMode: currentMode === "TEST",
      simulated: currentMode === "SIMULATION",
    });
  }
};

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    timezone: "Africa/Lagos",
    mode: currentMode,
    postmarkMode: currentMode,
    testMode: currentMode === "TEST",
    simulated: currentMode === "SIMULATION",
    clientInitialized: currentMode !== "SIMULATION" && client !== null,
    environmentVars: {
      POSTMARK_FULL_SIMULATION: process.env.POSTMARK_FULL_SIMULATION,
      POSTMARK_TEST_MODE: process.env.POSTMARK_TEST_MODE,
      NODE_ENV: process.env.NODE_ENV,
      HAS_LIVE_TOKEN: !!POSTMARK_LIVE_TOKEN,
    },
  });
});

// Email endpoints
app.post("/api/email/send", sendEmailHandler);
app.post("/api/email/inbound-email", inboundEmailHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const modeIndicator = {
    SIMULATION: "🧪 SIMULATION MODE",
    TEST: "🧪 TEST MODE",
    LIVE: "🚀 LIVE MODE",
  }[currentMode];

  console.log(
    `${modeIndicator} Email server running on port ${PORT} at ${new Date().toLocaleString(
      "en-US",
      {
        timeZone: "Africa/Lagos",
      }
    )}`
  );
  console.log(`📧 Email service active (${currentMode} mode)`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);

  if (currentMode === "SIMULATION") {
    console.log(
      "💡 All emails will be simulated - no actual sending will occur"
    );
  } else if (currentMode === "TEST") {
    console.log(
      "🧪 Test mode - real emails will be sent with test headers via Postmark"
    );
    console.log("📧 Using Postmark's official test token (POSTMARK_API_TEST)");
  } else {
    console.log("⚠️  Live mode - actual emails will be sent via Postmark");
  }
});