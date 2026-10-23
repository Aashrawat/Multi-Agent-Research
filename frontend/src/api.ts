import type { HistoryDetail, HistoryItem, Job, User } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  // FastAPI validation errors: [{ loc, msg, ... }]
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string; loc?: unknown[] };
    const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : "";
    return field ? `${field}: ${first.msg}` : (first.msg ?? fallback);
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(errorMessage(body, `${res.status} ${res.statusText}`), res.status);
  }
  return res.json() as Promise<T>;
}

// --- auth ------------------------------------------------------------------

export const signup = (name: string, email: string, password: string) =>
  request<User>("/api/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) });

export const login = (email: string, password: string) =>
  request<User>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const logout = () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });

export const fetchMe = () => request<User>("/api/auth/me");

// --- research ----------------------------------------------------------------

export const startResearch = (topic: string) =>
  request<Job>("/api/research", { method: "POST", body: JSON.stringify({ topic }) });

export const getResearch = (id: string) => request<Job>(`/api/research/${id}`);

// --- history -----------------------------------------------------------------

export const listHistory = (limit = 30, skip = 0) =>
  request<{ items: HistoryItem[]; total: number }>(`/api/history?limit=${limit}&skip=${skip}`);

export const getHistoryItem = (id: string) => request<HistoryDetail>(`/api/history/${id}`);

export const deleteHistoryItem = (id: string) =>
  request<{ ok: boolean }>(`/api/history/${id}`, { method: "DELETE" });
