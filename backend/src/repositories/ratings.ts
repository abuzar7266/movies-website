import { prisma as defaultClient } from "@/db.js";

export function ratingsRepo(client: any = defaultClient) {
  return {
    findUserMovieRating(userId: string, movieId: string) {
      return client.rating.findUnique({ where: { movieId_userId: { movieId, userId } } });
    }
  };
}
