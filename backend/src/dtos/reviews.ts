import { z } from "zod";

export const createReviewBody = z.object({
  movieId: z.string().uuid(),
  content: z.string().min(1)
});

export const reviewIdParam = z.object({ id: z.string().uuid() });

export const updateReviewBody = z.object({
  content: z.string().min(1)
});

