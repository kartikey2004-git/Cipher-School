import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { migrateGuestToUser } from "../services/identity.service";

export const migrateIdentityHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { guestId, userId } = req.body;

    if (!guestId || typeof guestId !== "string") {
      throw new ApiError(400, "Invalid or missing guestId");
    }

    if (!userId || typeof userId !== "string") {
      throw new ApiError(400, "Invalid or missing userId");
    }

    const result = await migrateGuestToUser(guestId, userId);

    const response = new ApiResponse(
      200,
      result,
      "Guest identity migrated successfully",
      { guestId, userId }
    );
    res.status(response.statusCode).json(response);
  }
);
