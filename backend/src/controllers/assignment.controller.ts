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

  return res
    .status(200)
    .json(
      new ApiResponse(200, assignments, "Assignments fetched successfully")
    );
});

const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) {
    throw new ApiError(400, "Assignment ID is required");
  }

  const assignment = await getassignmentById(id);

  return res
    .status(200)
    .json(new ApiResponse(200, assignment, "Assignment fetched successfully"));
});

export { getAllAssignments, getAssignmentById };
