import { toast } from "@hooks/use-toast";

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const obj = body as Record<string, unknown>;
  const err = obj.error;
  if (err && typeof err === "object") {
    const msg = (err as Record<string, unknown>).message;
    if (typeof msg === "string") return msg;
  }
  const msg2 = obj.message;
  return typeof msg2 === "string" ? msg2 : undefined;
}

export function apiUrl(path: string): string {
  if (API_BASE) {
    try {
      return new URL(path, API_BASE.endsWith("/") ? API_BASE : API_BASE + "/").toString();
    } catch {
      return (API_BASE || "") + path;
    }
  }
  if (import.meta.env.DEV) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

async function request<T>(
  path: string,
  init: (RequestInit & { json?: unknown; silentError?: boolean; retried?: boolean }) = {}
): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  let body = init.body;
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  try {
    const res = await fetch(apiUrl(path), {
      credentials: "include",
      ...init,
      headers,
      body,
    });
    if (res.status === 401 && !init.retried && path !== "/auth/refresh") {
      try {
        const refresh = await fetch(apiUrl("/auth/refresh"), {
          method: "POST",
          credentials: "include",
          headers: new Headers({ Accept: "application/json" }),
        });
        if (refresh.ok) {
          return await request<T>(path, { ...init, retried: true });
        }
      } catch {
        void 0;
      }
    }
    const text = await res.text();
    const maybeJson = text ? safeParseJSON(text) : null;
    if (!res.ok) {
      const message = extractMessage(maybeJson) || res.statusText || "Request failed";
      if (!init.silentError && res.status >= 500) {
        toast.error(message || "Server error");
      }
      throw new ApiError(message, res.status, maybeJson ?? text);
    }
    return (maybeJson as T) ?? (undefined as unknown as T);
  } catch (e) {
    const err = e as { name?: unknown; message?: unknown };
    const name = typeof err.name === "string" ? err.name : "";
    const message = typeof err.message === "string" ? err.message : "";
    if (!init.silentError && (name === "TypeError" || message.includes("Network"))) {
      toast.error("Network error. Please check your connection.");
    }
    throw e;
  }
}

function safeParseJSON(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  get: <T>(path: string, init?: RequestInit & { silentError?: boolean }) => request<T>(path, { method: "GET", ...(init || {}) }),
  post: <T>(path: string, json?: unknown, init?: RequestInit & { silentError?: boolean }) => request<T>(path, { method: "POST", json, ...(init || {}) }),
  put:  <T>(path: string, json?: unknown, init?: RequestInit & { silentError?: boolean }) => request<T>(path, { method: "PUT", json, ...(init || {}) }),
  patch:<T>(path: string, json?: unknown, init?: RequestInit & { silentError?: boolean }) => request<T>(path, { method: "PATCH", json, ...(init || {}) }),
  delete:<T>(path: string, init?: RequestInit & { silentError?: boolean }) => request<T>(path, { method: "DELETE", ...(init || {}) }),
};
