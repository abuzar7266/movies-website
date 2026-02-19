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

function buildUrl(path: string): string {
  if (API_BASE) {
    try {
      return new URL(path, API_BASE.endsWith("/") ? API_BASE : API_BASE + "/").toString();
    } catch {
      return (API_BASE || "") + path;
    }
  }
  return path;
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  let body = init.body;
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(buildUrl(path), {
    credentials: "include",
    ...init,
    headers,
    body,
  });
  const text = await res.text();
  const maybeJson = text ? safeParseJSON(text) : null;
  if (!res.ok) {
    throw new ApiError(
      (maybeJson && (maybeJson as any).message) || res.statusText || "Request failed",
      res.status,
      maybeJson ?? text
    );
  }
  return (maybeJson as T) ?? (undefined as unknown as T);
}

function safeParseJSON(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { method: "GET", ...(init || {}) }),
  post: <T>(path: string, json?: unknown, init?: RequestInit) => request<T>(path, { method: "POST", json, ...(init || {}) }),
  put:  <T>(path: string, json?: unknown, init?: RequestInit) => request<T>(path, { method: "PUT", json, ...(init || {}) }),
  patch:<T>(path: string, json?: unknown, init?: RequestInit) => request<T>(path, { method: "PATCH", json, ...(init || {}) }),
  delete:<T>(path: string, init?: RequestInit) => request<T>(path, { method: "DELETE", ...(init || {}) }),
};

