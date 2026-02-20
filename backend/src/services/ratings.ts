import { HttpError } from "@middleware/errors.js";
import { prisma } from "@/db.js";
import { ratingsRepo } from "@repositories/ratings.js";
import { enqueueMovieRankRecompute } from "@services/movies.js";

export async function upsertRating(userId: string, data: { movieId: string; value: number }) {
  const movie = await prisma.movie.findUnique({ where: { id: data.movieId }, select: { id: true } });
  if (!movie) throw new HttpError(404, "Movie not found", "not_found");
  const result = await prisma.$transaction(async (tx) => {
    await tx.rating.upsert({
      where: { movieId_userId: { movieId: data.movieId, userId } },
      update: { value: data.value },
      create: { movieId: data.movieId, userId, value: data.value }
    });
    const agg = await tx.rating.aggregate({
      where: { movieId: data.movieId },
      _avg: { value: true }
    });
    const avg = Number(agg._avg.value ?? 0);
    const updatedMovie = await tx.movie.update({
      where: { id: data.movieId },
      data: { averageRating: avg }
    });
    return updatedMovie.averageRating;
  });
  enqueueMovieRankRecompute();
  return { averageRating: result };
}

export async function getUserRating(userId: string, movieId: string) {
  const Ratings = ratingsRepo();
  const r = await Ratings.findUserMovieRating(userId, movieId);
  return r?.value ?? null;
}

