import { prisma } from "../db.js";
import { HttpError } from "../middleware/errors.js";
import { movieSelect } from "../selects.js";

export async function createMovie(userId: string, data: { title: string; releaseDate: string; trailerUrl?: string; synopsis: string }) {
  const exists = await prisma.movie.findUnique({ where: { title: data.title } });
  if (exists) throw new HttpError(409, "Movie title already exists", "title_taken");
  return prisma.movie.create({
    data: {
      title: data.title,
      releaseDate: new Date(data.releaseDate),
      trailerUrl: data.trailerUrl || "",
      synopsis: data.synopsis,
      createdBy: userId
    },
    select: movieSelect
  });
}

export async function getMovieOrThrow(id: string) {
  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) throw new HttpError(404, "Movie not found", "not_found");
  return movie;
}

export async function listMovies(opts: {
  q?: string;
  minStars?: number;
  reviewScope?: "all" | "mine" | "not_mine";
  sort?: "reviews_desc" | "rating_desc" | "release_desc" | "release_asc" | "uploaded_desc";
  page: number;
  pageSize: number;
  userId?: string;
}) {
  const where: any = {};
  if (opts.q) {
    where.OR = [
      { title: { contains: opts.q, mode: "insensitive" } },
      { synopsis: { contains: opts.q, mode: "insensitive" } }
    ];
  }
  if (typeof opts.minStars === "number" && !Number.isNaN(opts.minStars)) {
    where.averageRating = { gte: opts.minStars };
  }
  if (opts.reviewScope && opts.reviewScope !== "all" && opts.userId) {
    if (opts.reviewScope === "mine") {
      where.reviews = { some: { userId: opts.userId } };
    } else if (opts.reviewScope === "not_mine") {
      where.NOT = { reviews: { some: { userId: opts.userId } } };
    }
  }
  const orderBy =
    opts.sort === "reviews_desc"
      ? { reviewCount: "desc" as const }
      : opts.sort === "rating_desc"
      ? { averageRating: "desc" as const }
      : opts.sort === "release_desc"
      ? { releaseDate: "desc" as const }
      : opts.sort === "release_asc"
      ? { releaseDate: "asc" as const }
      : { createdAt: "desc" as const };
  const [total, items] = await prisma.$transaction([
    prisma.movie.count({ where }),
    prisma.movie.findMany({
      where,
      orderBy,
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      select: movieSelect
    })
  ]);
  return { items, total, page: opts.page, pageSize: opts.pageSize };
}

export async function ensureOwnedMovie(userId: string, id: string) {
  const movie = await prisma.movie.findUnique({ where: { id } });
  if (!movie) throw new HttpError(404, "Movie not found", "not_found");
  if (movie.createdBy !== userId) throw new HttpError(403, "Forbidden", "forbidden");
  return movie;
}

export async function updateMovie(userId: string, id: string, updates: { title?: string; releaseDate?: string; trailerUrl?: string; synopsis?: string }) {
  const movie = await ensureOwnedMovie(userId, id);
  if (updates.title && updates.title !== movie.title) {
    const exists = await prisma.movie.findUnique({ where: { title: updates.title } });
    if (exists) throw new HttpError(409, "Movie title already exists", "title_taken");
  }
  return prisma.movie.update({
    where: { id },
    data: {
      title: updates.title ?? undefined,
      releaseDate: updates.releaseDate ? new Date(updates.releaseDate) : undefined,
      trailerUrl: updates.trailerUrl ?? undefined,
      synopsis: updates.synopsis ?? undefined
    },
    select: movieSelect
  });
}

export async function deleteMovie(userId: string, id: string) {
  await ensureOwnedMovie(userId, id);
  await prisma.movie.delete({ where: { id } });
}

export async function setPoster(userId: string, id: string, mediaId: string) {
  await ensureOwnedMovie(userId, id);
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) throw new HttpError(404, "Media not found", "not_found");
  if (media.ownerUserId && media.ownerUserId !== userId) throw new HttpError(403, "Forbidden", "forbidden");
  return prisma.movie.update({ where: { id }, data: { posterMediaId: mediaId } });
}

export async function suggestMovies(q: string) {
  if (!q.trim()) return [];
  return prisma.movie.findMany({
    where: { title: { contains: q, mode: "insensitive" } },
    orderBy: [{ reviewCount: "desc" }, { averageRating: "desc" }, { createdAt: "desc" }],
    take: 5,
    select: { id: true, title: true, posterMediaId: true }
  });
}

