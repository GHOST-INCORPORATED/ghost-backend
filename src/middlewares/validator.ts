import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { errorResponse } from "../utils/response";

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    // Return validation errors
    errorResponse(res, "Validation error", 400, errors.array());
    return;
  };
};
