import mongoose, { Schema } from "mongoose";
import type { ISandboxMeta } from "../types/types";

const SandboxMetaSchema = new Schema<ISandboxMeta>(
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
    schemaName: {
      type: String,
      required: true,
      unique: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

SandboxMetaSchema.index({ identityId: 1, assignmentId: 1 }, { unique: true });

export const SandboxMeta = mongoose.model<ISandboxMeta>(
  "SandboxMeta",
  SandboxMetaSchema
);
