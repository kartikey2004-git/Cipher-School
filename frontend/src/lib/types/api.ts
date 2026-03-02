export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error: string | null;
  message: string;
  meta?: Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorMessage: string,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(errorMessage);
    this.name = "ApiError";
  }
}

export interface SandboxInitResponse {
  sandboxId: string;
  schemaName: string;
  isNew: boolean;
}

export interface ExecuteQueryResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

export interface GradingResponse {
  passed: boolean;
  executionTime: number;
  rowCount: number;
  reason?: string;
}

export type HintType = "syntax" | "logic" | "approach";

export interface HintResponse {
  hint: string;
  hintType: HintType;
  requestId: string;
}

export interface HintHistoryItem {
  hint: string;
  hintType: HintType;
  createdAt: string;
}

export interface ProgressData {
  lastQuery: string;
  attemptCount: number;
  isCompleted: boolean;
  completedAt?: string;
  lastAttemptAt: string;
}

export interface ProgressListItem {
  assignmentId: string;
  progress: ProgressData;
}

export interface MigrateResponse {
  sandboxesMigrated: number;
  progressMigrated: number;
  executionLogsMigrated: number;
  hintLogsMigrated: number;
}

export interface HealthResponse {
  status: string;
}
