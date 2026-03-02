import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import type { ExecuteQueryBody } from "../types/types";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { executequery } from "../services/execution.service";
import { SandboxMeta } from "../models/sandboxMeta.model";
import mongoose from "mongoose";

const executeQuery = asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId, query } = req.body as ExecuteQueryBody;

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

  const existingSandbox = await SandboxMeta.findOne({
    identityId,
    assignmentId: new mongoose.Types.ObjectId(assignmentId),
  });

  if (!existingSandbox) {
    throw new ApiError(
      404,
      "Sandbox not found. Please initialize sandbox first."
    );
  }

  try {
    const result = await executequery(identityId, assignmentId, query);

    const response = new ApiResponse(
      200,
      result,
      "Query executed successfully"
    );
    res.status(response.statusCode).json(response);
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    const errorMessage = error.message || "Unknown execution error";

    const [errorType, ...messageParts] = errorMessage.split(": ");
    const message = messageParts.join(": ") || errorMessage;

    let statusCode = 500;
    switch (errorType) {
      case "VALIDATION_ERROR":
        statusCode = 400;
        break;
      case "SANDBOX_NOT_FOUND":
        statusCode = 404;
        break;
      case "TIMEOUT":
        statusCode = 408;
        break;
      case "PERMISSION_ERROR":
        statusCode = 403;
        break;
      case "SYNTAX_ERROR":
      case "RUNTIME_ERROR":
        statusCode = 400;
        break;
    }

    throw new ApiError(statusCode, message);
  }
});

export { executeQuery };
