import { ApiError, type ApiResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const IDENTITY_STORAGE_KEY = "sql_learn_identity_id";

export function getIdentityId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(IDENTITY_STORAGE_KEY);
}

export function setIdentityId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IDENTITY_STORAGE_KEY, id);
}

export function clearIdentityId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(IDENTITY_STORAGE_KEY);
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  raw?: boolean;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, raw, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  const identityId = getIdentityId();
  if (identityId) {
    headers["X-Identity-ID"] = identityId;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const returnedIdentity = response.headers.get("X-Identity-ID");
  if (returnedIdentity) {
    setIdentityId(returnedIdentity);
  }

  if (raw) {
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    return (await response.json()) as T;
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new ApiError(response.status, json.error ?? json.message, json.meta);
  }

  return json.data;
}

export const api = {
  get<T>(endpoint: string, opts?: RequestOptions) {
    return apiFetch<T>(endpoint, { method: "GET", ...opts });
  },
  post<T>(endpoint: string, body?: unknown, opts?: RequestOptions) {
    return apiFetch<T>(endpoint, { method: "POST", body, ...opts });
  },
  patch<T>(endpoint: string, body?: unknown, opts?: RequestOptions) {
    return apiFetch<T>(endpoint, { method: "PATCH", body, ...opts });
  },
};
