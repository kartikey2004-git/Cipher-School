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

export interface ExecuteQueryBody {
  assignmentId: string;
  query: string;
}

export interface QueryResult {
  columns: string[];
  rows: object[];
  rowCount: number;
  executionTime: number;
}

export interface ValidationError {
  type:
    | "FORBIDDEN_KEYWORD"
    | "MULTIPLE_STATEMENTS"
    | "EMPTY_QUERY"
    | "INVALID_SYNTAX";
  message: string;
  details?: string;
}

export interface ExecutionError {
  type:
    | "SANDBOX_NOT_FOUND"
    | "VALIDATION_ERROR"
    | "TIMEOUT"
    | "SYNTAX_ERROR"
    | "RUNTIME_ERROR"
    | "PERMISSION_ERROR";
  message: string;
  details?: string;
}

export const BLOCKED_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "DROP",
  "ALTER",
  "COPY",
  "CALL",
  "DO",
  "GRANT",
  "REVOKE",
  "TRUNCATE",
  "EXECUTE",
  "PREPARE",
  "DEALLOCATE",
  "DISCARD",
  "RESET",
];

export const ALLOWED_KEYWORDS = ["SELECT", "WITH"];

export const DEFAULT_TIMEOUT = 5000;
