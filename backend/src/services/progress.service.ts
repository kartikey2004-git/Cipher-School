import mongoose from "mongoose";
import { UserProgress } from "../models/userProgress.model";
import type { ProgressData, ProgressUpdate } from "../types/types";

const getOrCreateProgress = async (
  identityId: string,
  assignmentId: string
): Promise<ProgressData> => {
  try {
    let progress = await UserProgress.findOne({
      identityId,
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    });

    if (!progress) {
      progress = await UserProgress.create({
        identityId,
        assignmentId: new mongoose.Types.ObjectId(assignmentId),
        lastQuery: "",
        attemptCount: 0,
        isCompleted: false,
        lastAttemptAt: new Date(),
      });
    }

    return {
      lastQuery: progress.lastQuery,
      attemptCount: progress.attemptCount,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
      lastAttemptAt: progress.lastAttemptAt,
    };
  } catch (error) {
    console.error("Error getting/creating progress:", error);
    throw error;
  }
};

const updateProgress = async (
  identityId: string,
  assignmentId: string,
  updates: ProgressUpdate
): Promise<ProgressData> => {
  try {
    const setData: Record<string, any> = {
      lastAttemptAt: new Date(),
    };

    if (updates.lastQuery !== undefined) {
      setData.lastQuery = updates.lastQuery;
    }

    if (updates.markCompleted) {
      setData.isCompleted = true;
      setData.completedAt = new Date();
    }

    const updateData: Record<string, any> = { $set: setData };

    if (updates.incrementAttempt) {
      updateData.$inc = { attemptCount: 1 };
    }

    const progress = await UserProgress.findOneAndUpdate(
      {
        identityId,
        assignmentId: new mongoose.Types.ObjectId(assignmentId),
      },
      updateData,
      {
        returnDocument: "after",
        upsert: true,
        maxTimeMS: 5000,
      }
    );

    if (!progress) {
      throw new Error("Failed to update progress - document not found");
    }

    return {
      lastQuery: progress.lastQuery,
      attemptCount: progress.attemptCount,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
      lastAttemptAt: progress.lastAttemptAt,
    };
  } catch (error) {
    console.error("Error updating progress:", error);
    throw error;
  }
};

const getAllProgress = async (
  identityId: string
): Promise<
  Array<{
    assignmentId: string;
    progress: ProgressData;
  }>
> => {
  try {
    const progressRecords = await UserProgress.find({
      identityId,
    }).populate("assignmentId", "title difficulty");

    return progressRecords.map((record) => ({
      assignmentId: record.assignmentId._id.toString(),
      progress: {
        lastQuery: record.lastQuery,
        attemptCount: record.attemptCount,
        isCompleted: record.isCompleted,
        completedAt: record.completedAt,
        lastAttemptAt: record.lastAttemptAt,
      },
    }));
  } catch (error) {
    console.error("Error getting all progress:", error);
    throw error;
  }
};

const deleteProgress = async (
  identityId: string,
  assignmentId: string
): Promise<void> => {
  try {
    await UserProgress.deleteOne({
      identityId,
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    });
  } catch (error) {
    console.error("Error deleting progress:", error);
    throw error;
  }
};

export { getOrCreateProgress, updateProgress, getAllProgress, deleteProgress };
