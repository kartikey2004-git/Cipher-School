import mongoose, { Schema, Document } from "mongoose";
import type {
  IAssignment,
  IColumn,
  IExpectedOutput,
  ITable,
  ValidationConfig,
} from "../types/types";

const ColumnSchema = new Schema<IColumn>({
  columnName: {
    type: String,
    required: true,
  },
  dataType: {
    type: String,
    required: true,
  },
});

const TableSchema = new Schema<ITable>({
  tableName: {
    type: String,
    required: true,
  },
  columns: [ColumnSchema],
  rows: [
    {
      type: Schema.Types.Mixed,
    },
  ],
});

const ExpectedOutputSchema = new Schema<IExpectedOutput>({
  type: {
    type: String,
    required: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

const ValidationConfigSchema = new Schema<ValidationConfig>({
  orderMatters: {
    type: Boolean,
    default: false,
  },
  numericTolerance: {
    type: Number,
    default: 0,
  },
  caseSensitive: {
    type: Boolean,
    default: false,
  },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    question: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      required: true,
    },
    sampleTables: [TableSchema],
    expectedOutput: {
      type: ExpectedOutputSchema,
      required: true,
    },
    validationConfig: {
      type: ValidationConfigSchema,
      default: () => ({
        orderMatters: false,
        numericTolerance: 0,
        caseSensitive: false,
      }),
    },
  },
  {
    timestamps: true,
  }
);

export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  AssignmentSchema
);
