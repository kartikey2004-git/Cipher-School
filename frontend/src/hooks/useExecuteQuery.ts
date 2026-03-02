"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { executeQuery, submitForGrading } from "@/lib/api";
import type { ExecuteQueryResponse, GradingResponse } from "@/lib/types";
import { useUiStore } from "@/store/uiStore";

export function useExecuteQuery(assignmentId: string) {
  const setIsExecuting = useUiStore((s) => s.setIsExecuting);
  const queryClient = useQueryClient();

  return useMutation<ExecuteQueryResponse, Error, string>({
    mutationFn: (query: string) => executeQuery(assignmentId, query),
    onMutate: () => setIsExecuting(true),
    onSettled: () => {
      setIsExecuting(false);
      queryClient.invalidateQueries({ queryKey: ["progress", assignmentId] });
    },
  });
}

export function useGradeQuery(assignmentId: string) {
  const setIsGrading = useUiStore((s) => s.setIsGrading);
  const queryClient = useQueryClient();

  return useMutation<GradingResponse, Error, string>({
    mutationFn: (query: string) => submitForGrading(assignmentId, query),
    onMutate: () => setIsGrading(true),
    onSettled: () => {
      setIsGrading(false);
      queryClient.invalidateQueries({ queryKey: ["progress", assignmentId] });
    },
  });
}
