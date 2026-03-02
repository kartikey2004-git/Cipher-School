"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSandbox } from "@/lib/api";
import { fetchProgress } from "@/lib/api";
import type { SandboxInitResponse, ProgressData } from "@/lib/types";

export function useSandboxInit(assignmentId: string) {
  return useMutation<SandboxInitResponse, Error>({
    mutationFn: () => initSandbox(assignmentId),
  });
}

export function useProgress(assignmentId: string) {
  return useQuery<ProgressData>({
    queryKey: ["progress", assignmentId],
    queryFn: () => fetchProgress(assignmentId),
    enabled: !!assignmentId,
    staleTime: 15 * 1000,
  });
}
