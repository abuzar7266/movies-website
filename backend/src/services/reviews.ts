import { HttpError } from "@middleware/errors.js";
import { reviewSelect } from "@/selects.js";
import { prisma } from "@/db.js";
import { reviewsRepo } from "@repositories/reviews.js";
import { enqueueMovieRankRecompute } from "@services/movies.js";
import { bumpCacheVersion } from "@/redis.js";

export async function createReview(userId: string, data: { movieId: string; content: string }) {
  const movie = await prisma.movie.findUnique({ where: { id: data.movieId }, select: { id: true } });
  if (!movie) throw new HttpError(404, "Movie not found", "not_found");
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: { movieId: data.movieId, userId, content: data.content },
      select: reviewSelect
    });
    await tx.movie.update({
      where: { id: data.movieId },
      data: { reviewCount: { increment: 1 } }
    });
    return review;
  });
  enqueueMovieRankRecompute();
  await bumpCacheVersion("v:movies");
  await bumpCacheVersion(`v:reviews:${data.movieId}`);
  return result;
}

export async function listReviewsByMovie(movieId: string, page: number, pageSize: number) {
  const { total, items } = await prisma.$transaction(async (tx) => {
    const Reviews = reviewsRepo(tx);
    const total = await Reviews.countByMovie(movieId);
    const items = await Reviews.findManyByMovie(movieId, (page - 1) * pageSize, pageSize);
    return { total, items };
  });
  return { items, total, page, pageSize };
}

export async function updateReview(userId: string, id: string, content: string) {
  const Reviews = reviewsRepo();
  const updatedCount = await Reviews.updateContentIfOwned(id, userId, content);
  if (updatedCount.count === 0) throw new HttpError(404, "Review not found", "not_found");
  const updated = await Reviews.findById(id);
  if (updated) {
    await bumpCacheVersion(`v:reviews:${updated.movieId}`);
  }
  return updated;
}

export async function deleteReview(userId: string, id: string) {
  const movieId = await prisma.$transaction(async (tx) => {
    const r = await tx.review.findFirst({ where: { id, userId } });
    if (!r) throw new HttpError(404, "Review not found", "not_found");
    await tx.review.delete({ where: { id } });
    await tx.movie.update({
      where: { id: r.movieId },
      data: { reviewCount: { decrement: 1 } }
    });
    return r.movieId;
  });
  enqueueMovieRankRecompute();
  await bumpCacheVersion("v:movies");
  await bumpCacheVersion(`v:reviews:${movieId}`);
}

