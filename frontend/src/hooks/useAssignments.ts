"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAssignments, fetchAssignment, fetchAllProgress } from "@/lib/api";
import type {
  AssignmentListItem,
  AssignmentDetail,
  ProgressListItem,
} from "@/lib/types";

/** Fetch all assignments (list view). Public — no identity needed. */
export function useAssignments() {
  return useQuery<AssignmentListItem[]>({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/** Fetch a single assignment by id (full detail). Public. */
export function useAssignment(id: string) {
  return useQuery<AssignmentDetail>({
    queryKey: ["assignment", id],
    queryFn: () => fetchAssignment(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetch all progress records for the current identity. */
export function useAllProgress() {
  return useQuery<ProgressListItem[]>({
    queryKey: ["progress"],
    queryFn: fetchAllProgress,
    staleTime: 30 * 1000,
  });
}
