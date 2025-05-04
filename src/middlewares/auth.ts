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
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Unauthorized: No token provided", 401);
    }

    const token = authHeader.split("Bearer ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.userId = decodedToken.uid;
      req.user = decodedToken;
      next();
    } catch (error) {
      logger.error("Authentication error:", { error });
      return errorResponse(res, "Unauthorized: Invalid token", 401);
    }
  } catch (error) {
    next(error);
  }
};
