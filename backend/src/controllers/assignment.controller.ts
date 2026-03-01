import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getallAssignments,
  getassignmentById,
} from "../services/assignment.service";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

const getAllAssignments = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await getallAssignments();

  const response = new ApiResponse(
    200,
    assignments,
    "Assignments fetched successfully"
  );
  res.status(response.statusCode).json(response);
});

const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    throw new ApiError(400, "Invalid assignment id");
  }

  const assignment = await getassignmentById(id);

  const response = new ApiResponse(
    200,
    assignment,
    "Assignment fetched successfully"
  );
  res.status(response.statusCode).json(response);
});

export { getAllAssignments, getAssignmentById };
