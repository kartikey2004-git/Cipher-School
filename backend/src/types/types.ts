import type { Document } from "mongoose";
import type mongoose from "mongoose";

export interface IColumn {
  columnName: string;
  dataType: string;
}

export interface ITable {
  tableName: string;
  columns: IColumn[];
  rows: Record<string, any>[];
}

export interface IExpectedOutput {
  type: string;
  value: any;
}

export interface ISandboxMeta extends Document {
  identityId: string;
  assignmentId: mongoose.Types.ObjectId;
  schemaName: string;
  createdAt: Date;
  lastUsedAt: Date;
}
