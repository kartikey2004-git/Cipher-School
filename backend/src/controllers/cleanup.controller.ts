import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getCleanupstats,
  performFullCleanup,
} from "../services/cleanup.service";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { env } from "../config/env";

const performCleanup = asyncHandler(async (req: Request, res: Response) => {
  const { daysToKeep = 7 } = req.body;

  const isAuthorized =
    env.CLEANUP_TOKEN &&
    req.headers["x-cleanup-authorization"] === env.CLEANUP_TOKEN;

  if (!isAuthorized) {
    throw new ApiError(
      403,
      "Unauthorized: Cleanup requires special authorization"
    );
  }

  const days = Math.max(1, Math.min(30, parseInt(daysToKeep) || 7));

  const result = await performFullCleanup(days);

  const response = new ApiResponse(
    200,
    result,
    "Cleanup completed successfully"
  );
  res.status(response.statusCode).json(response);
});

const getCleanupStats = asyncHandler(async (req: Request, res: Response) => {
  const isAuthorized =
    env.CLEANUP_TOKEN &&
    req.headers["x-cleanup-authorization"] === env.CLEANUP_TOKEN;

  if (!isAuthorized) {
    throw new ApiError(
      403,
      "Unauthorized: Stats access requires special authorization"
    );
  }

  const stats = await getCleanupstats();

  const response = new ApiResponse(
    200,
    stats,
    "Cleanup stats retrieved successfully"
  );
  res.status(response.statusCode).json(response);
});

export { performCleanup, getCleanupStats };
