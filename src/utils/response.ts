import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = "Operation successful",
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  message = "An error occurred",
  statusCode = 500,
  error?: any
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
