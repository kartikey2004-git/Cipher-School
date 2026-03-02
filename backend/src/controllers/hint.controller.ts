import type { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getHint, getHintHistory } from "../services/hint.service";
import { HintLog } from "../models/hintLog.model";

const getHintHandler = asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId, userQuery, hintType } = req.body;
  const identityId = req.identityId;

  if (!assignmentId || typeof assignmentId !== "string") {
    throw new ApiError(400, "Invalid or missing assignmentId");
  }

  if (!userQuery || typeof userQuery !== "string") {
    throw new ApiError(400, "Invalid or missing userQuery");
  }

  if (hintType && !["syntax", "logic", "approach"].includes(hintType)) {
    throw new ApiError(
      400,
      "Invalid hintType. Must be: syntax, logic, or approach"
    );
  }

  const hintRequest = {
    assignmentId,
    userQuery,
    hintType: (hintType as "syntax" | "logic" | "approach") || undefined,
  };

  const hintResponse = await getHint(identityId, hintRequest);

  const response = new ApiResponse(
    200,
    hintResponse,
    "Hint generated successfully"
  );
  res.status(response.statusCode).json(response);
});

const getHintHistoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignmentId } = req.query;
    const identityId = req.identityId;

    const filter = assignmentId ? { assignmentId } : {};
    const hints = await HintLog.find(filter)
      .select("hint hintType createdAt")
      .sort({ createdAt: -1 })
      .limit(20);

    const hintHistory = hints.map((hint: any) => ({
      hint: hint.hint,
      hintType: hint.hintType,
      createdAt: hint.createdAt.toISOString(),
    }));

    const response = new ApiResponse(
      200,
      hintHistory,
      "Hint history fetched successfully"
    );
    res.status(response.statusCode).json(response);
  }
);

export { getHintHandler, getHintHistoryHandler };
