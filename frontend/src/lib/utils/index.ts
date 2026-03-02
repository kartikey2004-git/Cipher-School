import toast from "react-hot-toast";
import { ApiError } from "@/lib/types";

export function handleApiError(error: unknown): void {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        toast.error("Session expired. Please log in again.");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;

      case 408:
        toast.error("Query timed out. Try optimizing your SQL.");
        return;

      case 400:
        toast.error(cleanErrorMessage(error.errorMessage));
        return;

      case 403:
        toast.error("Permission denied.");
        return;

      case 404:
        toast.error(cleanErrorMessage(error.errorMessage));
        return;

      case 500:
        if (error.errorMessage.toLowerCase().includes("rate limit")) {
          toast.error("Too many requests. Please wait before trying again.");
          return;
        }
        toast.error("Something went wrong. Please try again.");
        return;

      default:
        toast.error(error.errorMessage || "An unexpected error occurred.");
    }
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error("An unexpected error occurred.");
  }
}

function cleanErrorMessage(msg: string): string {
  return msg
    .replace(
      /^(VALIDATION_ERROR|SANDBOX_NOT_FOUND|TIMEOUT|SYNTAX_ERROR|PERMISSION_ERROR|FORBIDDEN_KEYWORD):\s*/gi,
      "",
    )
    .replace(
      /^(VALIDATION_ERROR|SANDBOX_NOT_FOUND|TIMEOUT|SYNTAX_ERROR|PERMISSION_ERROR|FORBIDDEN_KEYWORD):\s*/gi,
      "",
    );
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export const MAX_RESULT_ROWS = 1000;
