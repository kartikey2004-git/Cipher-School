import { Assignment } from "../models/assignment.model";
import { ApiError } from "../utils/ApiError";

export const getallAssignments = async () => {
  try {
    const assignments = await Assignment.find()
      .select("_id title description")
      .sort({ createdAt: -1 });

    if (!assignments.length) {
      throw new ApiError(404, "No assignments found");
    }

    return assignments;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to fetch assignments");
  }
};

export const getassignmentById = async (id: string) => {
  try {
    if (!id || typeof id !== "string") {
      throw new ApiError(400, "Invalid assignment id");
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      throw new ApiError(404, "Assignment not found with the provided id");
    }

    return assignment;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to fetch assignment");
  }
};
