import { prisma } from "../db.js";
import { HttpError } from "../middleware/errors.js";
import { reviewSelect } from "../selects.js";

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
  return result;
}

export async function listReviewsByMovie(movieId: string, page: number, pageSize: number) {
  const [total, items] = await prisma.$transaction([
    prisma.review.count({ where: { movieId } }),
    prisma.review.findMany({
      where: { movieId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: reviewSelect
    })
  ]);
  return { items, total, page, pageSize };
}

export async function updateReview(userId: string, id: string, content: string) {
  const updatedCount = await prisma.review.updateMany({
    where: { id, userId },
    data: { content }
  });
  if (updatedCount.count === 0) throw new HttpError(404, "Review not found", "not_found");
  return prisma.review.findUnique({ where: { id }, select: reviewSelect });
}

export async function deleteReview(userId: string, id: string) {
  await prisma.$transaction(async (tx) => {
    const r = await tx.review.findFirst({ where: { id, userId } });
    if (!r) throw new HttpError(404, "Review not found", "not_found");
    await tx.review.delete({ where: { id } });
    await tx.movie.update({
      where: { id: r.movieId },
      data: { reviewCount: { decrement: 1 } }
    });
  });
}

