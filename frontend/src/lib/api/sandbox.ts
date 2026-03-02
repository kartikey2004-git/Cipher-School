import { api } from "./client";
import type {
  SandboxInitResponse,
  ExecuteQueryResponse,
  GradingResponse,
} from "@/lib/types";

export function initSandbox(
  assignmentId: string,
): Promise<SandboxInitResponse> {
  return api.post<SandboxInitResponse>("/api/sandbox/init", { assignmentId });
}

export function executeQuery(
  assignmentId: string,
  query: string,
): Promise<ExecuteQueryResponse> {
  return api.post<ExecuteQueryResponse>("/api/sandbox/execute", {
    assignmentId,
    query,
  });
}

export function submitForGrading(
  assignmentId: string,
  query: string,
): Promise<GradingResponse> {
  return api.post<GradingResponse>("/api/grading", { assignmentId, query });
}
