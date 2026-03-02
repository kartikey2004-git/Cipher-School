import { api } from "./client";
import type { AssignmentListItem, AssignmentDetail } from "@/lib/types";

export function fetchAssignments(): Promise<AssignmentListItem[]> {
  return api.get<AssignmentListItem[]>("/api/assignments");
}

export function fetchAssignment(id: string): Promise<AssignmentDetail> {
  return api.get<AssignmentDetail>(`/api/assignments/${id}`);
}
