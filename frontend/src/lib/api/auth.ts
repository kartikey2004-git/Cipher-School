import { api } from "./client";
import type {
  MigrateResponse,
  ProgressData,
  ProgressListItem,
} from "@/lib/types";
import { getIdentityId, setIdentityId, clearIdentityId } from "./client";

// Re-export identity helpers for convenience
export { getIdentityId, setIdentityId, clearIdentityId };

/** GET /api/progress — all assignment progress for current identity. */
export function fetchAllProgress(): Promise<ProgressListItem[]> {
  return api.get<ProgressListItem[]>("/api/progress");
}

/** GET /api/progress/:assignmentId — get or create progress for one assignment. */
export function fetchProgress(assignmentId: string): Promise<ProgressData> {
  return api.get<ProgressData>(`/api/progress/${assignmentId}`);
}

/** PATCH /api/progress/:assignmentId — partially update progress. */
export function updateProgress(
  assignmentId: string,
  payload: {
    lastQuery?: string;
    incrementAttempt?: boolean;
    markCompleted?: boolean;
  },
): Promise<ProgressData> {
  return api.patch<ProgressData>(`/api/progress/${assignmentId}`, payload);
}

/** POST /api/identity/migrate — migrate guest data to authenticated user. */
export function migrateIdentity(
  guestId: string,
  userId: string,
): Promise<MigrateResponse> {
  return api.post<MigrateResponse>("/api/identity/migrate", {
    guestId,
    userId,
  });
}
