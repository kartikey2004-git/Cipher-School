import type { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getOrCreateProgress,
  updateProgress,
  getAllProgress,
} from "../services/progress.service";

const getProgressHandler = asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const identityId = req.identityId;

  if (!assignmentId || typeof assignmentId !== "string") {
    throw new ApiError(400, "Invalid assignment id");
  }

  const progress = await getOrCreateProgress(identityId, assignmentId);

  const response = new ApiResponse(
    200,
    progress,
    "Progress fetched successfully"
  );
  res.status(response.statusCode).json(response);
});

const updateProgressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params;
    const { lastQuery, incrementAttempt, markCompleted } = req.body;
    const identityId = req.identityId;

    if (!assignmentId || typeof assignmentId !== "string") {
      throw new ApiError(400, "Invalid assignment id");
    }

    const updates = {
      lastQuery,
      incrementAttempt: Boolean(incrementAttempt),
      markCompleted: Boolean(markCompleted),
    };

    const progress = await updateProgress(identityId, assignmentId, updates);

    const response = new ApiResponse(
      200,
      progress,
      "Progress updated successfully"
    );
    res.status(response.statusCode).json(response);
  }
);

const getAllProgressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const identityId = req.identityId;

    const allProgress = await getAllProgress(identityId);

    const response = new ApiResponse(
      200,
      allProgress,
      "All progress fetched successfully"
    );
    res.status(response.statusCode).json(response);
  }
);

export { getProgressHandler, updateProgressHandler, getAllProgressHandler };
