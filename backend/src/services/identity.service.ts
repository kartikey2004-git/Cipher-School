import { SandboxMeta } from "../models/sandboxMeta.model";
import { UserProgress } from "../models/userProgress.model";
import { ExecutionLog } from "../models/executionLog.model";
import { HintLog } from "../models/hintLog.model";
import { ApiError } from "../utils/ApiError";

export const migrateGuestToUser = async (
  guestId: string,
  userId: string
): Promise<{
  sandboxesMigrated: number;
  progressMigrated: number;
  executionLogsMigrated: number;
  hintLogsMigrated: number;
}> => {
  if (!guestId || !guestId.startsWith("guest_")) {
    throw new ApiError(400, "Invalid guest identity ID");
  }

  if (!userId || userId.startsWith("guest_")) {
    throw new ApiError(400, "Target user ID cannot be a guest identity");
  }

  if (guestId === userId) {
    throw new ApiError(400, "Source and target identity cannot be the same");
  }

  try {
    const guestSandboxes = await SandboxMeta.find({ identityId: guestId });
    let sandboxesMigrated = 0;

    for (const sandbox of guestSandboxes) {
      const existingUserSandbox = await SandboxMeta.findOne({
        identityId: userId,
        assignmentId: sandbox.assignmentId,
      });

      if (!existingUserSandbox) {
        await SandboxMeta.updateOne(
          { _id: sandbox._id },
          { $set: { identityId: userId } }
        );
        sandboxesMigrated++;
      }
      
    }

    const guestProgress = await UserProgress.find({ identityId: guestId });
    let progressMigrated = 0;

    for (const progress of guestProgress) {
      const existingUserProgress = await UserProgress.findOne({
        identityId: userId,
        assignmentId: progress.assignmentId,
      });

      if (!existingUserProgress) {
        await UserProgress.updateOne(
          { _id: progress._id },
          { $set: { identityId: userId } }
        );
        progressMigrated++;
      } else {
        // Merge: prefer completed status and higher attempt count
        const updates: Record<string, any> = {};
        if (progress.isCompleted && !existingUserProgress.isCompleted) {
          updates.isCompleted = true;
          updates.completedAt = progress.completedAt;
        }
        if (progress.attemptCount > existingUserProgress.attemptCount) {
          updates.attemptCount = progress.attemptCount;
        }
        if (Object.keys(updates).length > 0) {
          await UserProgress.updateOne(
            { _id: existingUserProgress._id },
            { $set: updates }
          );
        }
        // Delete the old guest progress record
        await UserProgress.deleteOne({ _id: progress._id });
        progressMigrated++;
      }
    }

    const execResult = await ExecutionLog.updateMany(
      { identityId: guestId },
      { $set: { identityId: userId } }
    );

    const hintResult = await HintLog.updateMany(
      { identityId: guestId },
      { $set: { identityId: userId } }
    );

    return {
      sandboxesMigrated,
      progressMigrated,
      executionLogsMigrated: execResult.modifiedCount,
      hintLogsMigrated: hintResult.modifiedCount,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Error migrating guest to user:", error);
    throw new ApiError(500, "Failed to migrate guest identity to user");
  }
};
