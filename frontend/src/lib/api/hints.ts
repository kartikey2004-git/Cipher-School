import { api } from "./client";
import type { HintResponse, HintHistoryItem, HintType } from "@/lib/types";

export function requestHint(
  assignmentId: string,
  userQuery: string,
  hintType?: HintType,
): Promise<HintResponse> {
  return api.post<HintResponse>("/api/hints", {
    assignmentId,
    userQuery,
    ...(hintType ? { hintType } : {}),
  });
}

export function fetchHintHistory(
  assignmentId?: string,
): Promise<HintHistoryItem[]> {
  const qs = assignmentId ? `?assignmentId=${assignmentId}` : "";
  return api.get<HintHistoryItem[]>(`/api/hints/history${qs}`);
}
