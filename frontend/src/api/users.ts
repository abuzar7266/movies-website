import type { Envelope } from "@src/types/api";
import { api } from "@api/client";

export interface MeDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarMediaId?: string | null;
}

export async function me(): Promise<Envelope<MeDTO>> {
  return api.get<Envelope<MeDTO>>("/users/me", { silentError: true });
}

export async function updateAvatar(mediaId: string): Promise<Envelope<MeDTO>> {
  return api.patch<Envelope<MeDTO>>("/users/me/avatar", { mediaId });
}
