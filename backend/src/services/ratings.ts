import { HttpError } from "@middleware/errors.js";
import { prisma } from "@/db.js";
import { ratingsRepo } from "@repositories/ratings.js";
import { enqueueMovieRankRecompute } from "@services/movies.js";
import { bumpCacheVersion } from "@/redisClient.js";

export async function upsertRating(userId: string, data: { movieId: string; value: number }) {
  const movie = await prisma.movie.findUnique({ where: { id: data.movieId }, select: { id: true } });
  if (!movie) throw new HttpError(404, "Movie not found", "not_found");
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rating.findUnique({
      where: { movieId_userId: { movieId: data.movieId, userId } },
      select: { value: true }
    });
    const m = await tx.movie.findUnique({
      where: { id: data.movieId },
      select: { averageRating: true, ratingCount: true }
    });
    if (!m) throw new HttpError(404, "Movie not found", "not_found");
    let newAvg: number;
    if (existing) {
      await tx.rating.update({
        where: { movieId_userId: { movieId: data.movieId, userId } },
        data: { value: data.value }
      });
      const sum = m.averageRating * m.ratingCount;
      newAvg = m.ratingCount > 0 ? (sum - existing.value + data.value) / m.ratingCount : data.value;
      const updated = await tx.movie.update({
        where: { id: data.movieId },
        data: { averageRating: Number(newAvg.toFixed(2)) }
      });
      return updated.averageRating;
    } else {
      await tx.rating.create({
        data: { movieId: data.movieId, userId, value: data.value }
      });
      const sum = m.averageRating * m.ratingCount;
      const newCount = m.ratingCount + 1;
      newAvg = (sum + data.value) / newCount;
      const updated = await tx.movie.update({
        where: { id: data.movieId },
        data: { averageRating: Number(newAvg.toFixed(2)), ratingCount: { increment: 1 } }
      });
      return updated.averageRating;
    }
  });
  enqueueMovieRankRecompute();
  await bumpCacheVersion("v:movies");
  return { averageRating: result };
}

export async function getUserRating(userId: string, movieId: string) {
  const Ratings = ratingsRepo();
  const r = await Ratings.findUserMovieRating(userId, movieId);
  return r?.value ?? null;
}

