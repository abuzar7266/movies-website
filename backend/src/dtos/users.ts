import { z } from "zod";

export const updateUserBody = z.object({
  name: z.string().min(1)
});

export const avatarBody = z.object({ mediaId: z.string().uuid().nullable() });

