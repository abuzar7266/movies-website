import type { Envelope } from "../types/api";
import { ApiError, apiUrl } from "./client";

export interface UploadResult {
  id: string;
  url: string;
}

export async function upload(file: File): Promise<Envelope<UploadResult>> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(apiUrl("/media"), { method: "POST", body: form, credentials: "include", headers: { Accept: "application/json" } });
  const text = await res.text();
  const json = text ? safeParseJSON(text) : null;

  if (!res.ok) {
    const message = extractMessage(json) || res.statusText || "Upload failed";
    throw new ApiError(message, res.status, json ?? text);
  }
  return (json as Envelope<UploadResult>) ?? (undefined as unknown as Envelope<UploadResult>);
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

function safeParseJSON(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
