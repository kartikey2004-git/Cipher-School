"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { requestHint, fetchHintHistory } from "@/lib/api";
import { useUiStore } from "@/store/uiStore";
import type { HintResponse, HintHistoryItem, HintType } from "@/lib/types";

export function useHintHistory(assignmentId: string) {
  return useQuery<HintHistoryItem[]>({
    queryKey: ["hints", "history", assignmentId],
    queryFn: () => fetchHintHistory(assignmentId),
    enabled: !!assignmentId,
    staleTime: 30 * 1000,
  });
}

export function useRequestHint(assignmentId: string) {
  return useMutation<
    HintResponse,
    Error,
    { userQuery: string; hintType?: HintType }
  >({
    mutationFn: ({ userQuery, hintType }) =>
      requestHint(assignmentId, userQuery, hintType),
    onSuccess: () => {},
  });
}
