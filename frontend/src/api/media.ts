import type { Envelope } from "@src/types/api";
import { api } from "@api/client";

export interface UploadResult {
  id: string;
  url: string;
}

export async function upload(file: File): Promise<Envelope<UploadResult>> {
  const form = new FormData();
  form.append("file", file);
  return api.request<Envelope<UploadResult>>("/media", {
    method: "POST",
    body: form,
    headers: new Headers({ Accept: "application/json" }),
    silentError: true,
  });
}
