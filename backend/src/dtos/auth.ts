import { z } from "zod";

export const registerBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

