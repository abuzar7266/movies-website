import { z } from "zod";

export const upsertRatingBody = z.object({
  movieId: z.string().uuid(),
  value: z.coerce.number().int().min(1).max(5)
});

export const ratingMovieIdParam = z.object({ movieId: z.string().uuid() });

