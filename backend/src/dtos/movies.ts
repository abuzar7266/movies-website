import { z } from "zod";

export const createMovieBody = z.object({
  title: z.string().min(1),
  releaseDate: z.string().datetime(),
  trailerUrl: z.string().url().optional().default(""),
  synopsis: z.string().min(1)
});

export const updateMovieBody = z.object({
  title: z.string().min(1).optional(),
  releaseDate: z.string().datetime().optional(),
  trailerUrl: z.string().url().optional(),
  synopsis: z.string().min(1).optional()
});

export const movieIdParam = z.object({ id: z.string().uuid() });

export const posterBody = z.object({ mediaId: z.string().uuid() });

