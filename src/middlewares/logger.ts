import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const logRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Log request
  logger.info(`${method} ${originalUrl} - Request received`);

  // Once response is finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    if (statusCode >= 400) {
      logger.warn(`${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
    } else {
      logger.info(`${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
    }
  });

  next();
};
