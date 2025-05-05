import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase";
import { errorResponse } from "../utils/response";
import logger from "../utils/logger";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: admin.auth.DecodedIdToken;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      errorResponse(res, "Unauthorized: No token provided", 401);
      return;
    }

    const token = authHeader.split("Bearer ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.userId = decodedToken.uid;
      req.user = decodedToken;
      next();
    } catch (error) {
      logger.error("Authentication error:", { error });
      errorResponse(res, "Unauthorized: Invalid token", 401);
      return;
    }
  } catch (error) {
    next(error);
  }
};
