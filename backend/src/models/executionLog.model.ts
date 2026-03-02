import mongoose, { Schema } from "mongoose";
import type { IExecutionLog } from "../types/types";

const ExecutionLogSchema = new Schema<IExecutionLog>(
  {
    identityId: {
      type: String,
      required: true,
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
    },
    executionTime: {
      type: Number,
      required: true,
    },
    rowCount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "error"],
      required: true,
    },
    errorMessage: {
      type: String,
    },
    schemaName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ExecutionLogSchema.index({ identityId: 1, assignmentId: 1 });

ExecutionLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

export const ExecutionLog = mongoose.model<IExecutionLog>(
  "ExecutionLog",
  ExecutionLogSchema
);
