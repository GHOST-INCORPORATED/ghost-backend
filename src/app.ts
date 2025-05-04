import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { errorHandler } from "./middlewares/error";
import routes from "./routes";
import logger from "./utils/logger";
import { logRequest } from "./middlewares/logger";

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging
app.use(logRequest);

// API routes
app.use("/api", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
