import type { Request, Response } from "express";
import type { GradeRequest } from "../types/types";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { gradeSubmission } from "../services/grading.service";

export const gradeSubmissionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { assignmentId, query } = req.body as GradeRequest;

    if (!assignmentId || typeof assignmentId !== "string") {
      throw new ApiError(400, "Invalid or missing assignmentId");
    }

    if (!query || typeof query !== "string") {
      throw new ApiError(400, "Invalid or missing query");
    }

    const identityId = req.identityId;
    if (!identityId) {
      throw new ApiError(401, "Identity not found in request");
    }

    const gradingResult = await gradeSubmission(
      identityId,
      assignmentId,
      query
    );

    const response = new ApiResponse(
      200,
      gradingResult,
      gradingResult.passed ? "Submission passed" : "Submission did not pass"
    );
    res.status(response.statusCode).json(response);
  }
);
