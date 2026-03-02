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

export interface ValidationConfig {
  orderMatters: boolean;
  numericTolerance: number;
  caseSensitive: boolean;
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

export interface NormalizedRow {
  [key: string]: any;
}

export interface NormalizedResult {
  rows: NormalizedRow[];
  columns: string[];
  rowCount: number;
}

export const FLOAT_PRECISION = 6;

export interface IHintLog extends Document {
  identityId: string;
  assignmentId: mongoose.Types.ObjectId;
  userQuery: string;
  hint: string;
  hintType: "syntax" | "logic" | "approach";
  requestId: string;
  createdAt: Date;
}

export interface IExecutionLog extends Document {
  identityId: string;
  assignmentId: mongoose.Types.ObjectId;
  query: string;
  executionTime: number;
  rowCount: number;
  status: "success" | "error";
  errorMessage?: string;
  schemaName: string;
  createdAt: Date;
}

export interface IUserProgress extends Document {
  identityId: string;
  assignmentId: mongoose.Types.ObjectId;
  lastQuery: string;
  attemptCount: number;
  isCompleted: boolean;
  completedAt?: Date;
  lastAttemptAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignment extends Document {
  title: string;
  description: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  sampleTables: ITable[];
  expectedOutput: IExpectedOutput;
  validationConfig: ValidationConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface HintRequest {
  assignmentId: string;
  userQuery: string;
  hintType?: "syntax" | "logic" | "approach";
}

export interface HintResponse {
  hint: string;
  hintType: "syntax" | "logic" | "approach";
  requestId: string;
}

export interface ProgressUpdate {
  lastQuery?: string;
  incrementAttempt?: boolean;
  markCompleted?: boolean;
}

export interface ProgressData {
  lastQuery: string;
  attemptCount: number;
  isCompleted: boolean;
  completedAt?: Date;
  lastAttemptAt: Date;
}

export interface LogExecutionData {
  identityId: string;
  assignmentId: string;
  query: string;
  executionTime: number;
  rowCount: number;
  status: "success" | "error";
  errorMessage?: string;
  schemaName: string;
}

export interface GradingResult {
  passed: boolean;
  executionTime: number;
  rowCount: number;
  reason?: string;
}

export interface ComparisonResult {
  passed: boolean;
  reason: string | null;
}

export interface GradeRequest {
  assignmentId: string;
  query: string;
}
