import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { initsandbox } from "../services/sandbox.service";

const initSandbox = asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.body;
  const identityId = req.identityId;

  if (!assignmentId) {
    throw new ApiError(400, "Assignment ID is required");
  }

  if (!identityId) {
    throw new ApiError(401, "Identity ID is required");
  }

  const result = await initsandbox(identityId, assignmentId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        schemaName: result.schemaName,
        isNew: result.isNew,
      },
      "Sandbox initialized successfully"
    )
  );
});

export { initSandbox };
