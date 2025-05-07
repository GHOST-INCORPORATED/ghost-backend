// src/controllers/user.controller.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { transferService } from "../services";
import { successResponse } from "../utils/response";
import { BankDetailsRequest } from "../types";

export class UserController {
  /**
   * Set bank details for user
   */
  async setBankDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { bankAccountNumber, bankCode, fullName, userId } = req.body;

      console.table({ bankAccountNumber, bankCode, fullName });

      // Create recipient on Paystack
      const recipientCode = await transferService.createPaystackRecipient({
        bankAccountNumber,
        bankCode,
        fullName,
        paystackRecipientCode: "", // Will be populated after creation
      });

      console.log({ recipientCode });

      // Save bank details to user profile
      await transferService.saveBankDetails(userId, {
        bankAccountNumber,
        bankCode,
        fullName,
        paystackRecipientCode: recipientCode,
      });

      successResponse(
        res,
        { recipientCode },
        "Bank details saved successfully"
      );
      return;
    } catch (error) {
      console.log({ error });

      next(error);
    }
  }
}

export default new UserController();
