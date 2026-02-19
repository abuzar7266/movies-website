import { z } from "zod";

const posterUrl = z
  .string()
  .min(1)
  .refine((v) => {
    if (v.startsWith("/media/")) return true;
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  });

export const createMovieBody = z.object({
  title: z.string().min(1),
  releaseDate: z.string().datetime(),
  trailerUrl: z.string().url().optional().default(""),
  synopsis: z.string().min(1),
  posterUrl: posterUrl.optional()
});

export const updateMovieBody = z.object({
  title: z.string().min(1).optional(),
  releaseDate: z.string().datetime().optional(),
  trailerUrl: z.string().url().optional(),
  synopsis: z.string().min(1).optional(),
  posterUrl: posterUrl.optional()
});

export const movieIdParam = z.object({ id: z.string().uuid() });

export const posterBody = z.object({ mediaId: z.string().uuid() });
