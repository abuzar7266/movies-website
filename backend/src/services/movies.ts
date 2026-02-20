import { HttpError } from "@middleware/errors.js";
import { moviesRepo } from "@repositories/movies.js";
import { prisma } from "@/db.js";
import type { Prisma, PrismaClient } from "@generated/prisma/client.js";

type MovieListItem = Awaited<ReturnType<ReturnType<typeof moviesRepo>["findMany"]>>[number];

let recomputeInFlight: Promise<void> | null = null;
let recomputeQueued = false;

async function computeMovieRankMap(
  client: Prisma.TransactionClient | PrismaClient = prisma
): Promise<Map<string, number>> {
  const rows = await client.movie.findMany({
    select: { id: true, reviewCount: true, averageRating: true, createdAt: true },
    orderBy: [{ reviewCount: "desc" }, { averageRating: "desc" }, { createdAt: "desc" }, { id: "asc" }]
  });

  const map = new Map<string, number>();
  rows.forEach((m, i) => map.set(m.id, i + 1));
  return map;
}

export async function recomputeMovieRanks(client: Prisma.TransactionClient | PrismaClient = prisma) {
  const rows = await client.movie.findMany({
    select: { id: true, rank: true },
    orderBy: [{ reviewCount: "desc" }, { averageRating: "desc" }, { createdAt: "desc" }, { id: "asc" }]
  });

  const rankMap = await computeMovieRankMap(client);
  const updates: Array<Promise<unknown>> = [];
  rows.forEach((m) => {
    const rank = rankMap.get(m.id) ?? 0;
    if (m.rank !== rank) {
      updates.push(client.movie.update({ where: { id: m.id }, data: { rank } }));
    }
  });
  await Promise.all(updates);
}

export function enqueueMovieRankRecompute() {
  if (process.env.NODE_ENV === "test") return;
  if (recomputeInFlight) {
    recomputeQueued = true;
    return;
  }
  recomputeInFlight = (async () => {
    try {
      await recomputeMovieRanks(prisma);
    } finally {
      recomputeInFlight = null;
      if (recomputeQueued) {
        recomputeQueued = false;
        enqueueMovieRankRecompute();
      }
    }
  })();
}

export async function createMovie(
  userId: string,
  data: { title: string; releaseDate: string; trailerUrl?: string; synopsis: string; posterUrl?: string }
) {
  const Repo = moviesRepo();
  const exists = await Repo.findUnique({ title: data.title });
  if (exists) throw new HttpError(409, "Movie title already exists", "title_taken");
  const movie = await prisma.$transaction(async (tx) => {
    const Repo = moviesRepo(tx);
    return Repo.create({
      title: data.title,
      releaseDate: new Date(data.releaseDate),
      trailerUrl: data.trailerUrl || "",
      synopsis: data.synopsis,
      posterUrl: data.posterUrl ?? undefined,
      createdByUser: { connect: { id: userId } }
    });
  });
  enqueueMovieRankRecompute();
  return movie;
}

export async function getMovieOrThrow(id: string) {
  const Repo = moviesRepo();
  const movie = await Repo.findUnique({ id });
  if (!movie) throw new HttpError(404, "Movie not found", "not_found");
  if (movie.rank === 0) {
    const map = await computeMovieRankMap(prisma);
    return { ...movie, rank: map.get(movie.id) ?? 0 };
  }
  return movie;
}

export async function listMovies(opts: {
  q?: string;
  minStars?: number;
  reviewScope?: "all" | "mine" | "not_mine";
  sort?: "reviews_desc" | "rating_desc" | "release_desc" | "release_asc" | "uploaded_desc" | "rank_asc";
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
    opts.sort === "rank_asc"
      ? { rank: "asc" as const }
      : opts.sort === "reviews_desc"
      ? { reviewCount: "desc" as const }
      : opts.sort === "rating_desc"
      ? { averageRating: "desc" as const }
      : opts.sort === "release_desc"
      ? { releaseDate: "desc" as const }
      : opts.sort === "release_asc"
      ? { releaseDate: "asc" as const }
      : { createdAt: "desc" as const };
  const { total, items } = await prisma.$transaction(async (tx): Promise<{ total: number; items: MovieListItem[] }> => {
    const Repo = moviesRepo(tx);
    const total = await Repo.count({ where });
    const items = await Repo.findMany({
      where,
      orderBy,
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize
    });
    return { total, items };
  });
  if (items.some((m) => m.rank === 0)) {
    const map = await computeMovieRankMap(prisma);
    const patched = items.map((m) => (m.rank === 0 ? { ...m, rank: map.get(m.id) ?? 0 } : m));
    return { items: patched, total, page: opts.page, pageSize: opts.pageSize };
  }
  return { items, total, page: opts.page, pageSize: opts.pageSize };
}

export async function ensureOwnedMovie(userId: string, id: string) {
  const Repo = moviesRepo();
  const movie = await Repo.findUnique({ id });
  if (!movie) throw new HttpError(404, "Movie not found", "not_found");
  if (movie.createdBy !== userId) throw new HttpError(403, "Forbidden", "forbidden");
  return movie;
}

export async function updateMovie(
  userId: string,
  id: string,
  updates: { title?: string; releaseDate?: string; trailerUrl?: string; synopsis?: string; posterUrl?: string }
) {
  const movie = await ensureOwnedMovie(userId, id);
  const Repo = moviesRepo();
  if (updates.title && updates.title !== movie.title) {
    const exists = await Repo.findUnique({ title: updates.title });
    if (exists) throw new HttpError(409, "Movie title already exists", "title_taken");
  }
  return Repo.update(
    { id },
    {
      title: updates.title ?? undefined,
      releaseDate: updates.releaseDate ? new Date(updates.releaseDate) : undefined,
      trailerUrl: updates.trailerUrl ?? undefined,
      synopsis: updates.synopsis ?? undefined,
      posterUrl: updates.posterUrl ?? undefined
    }
  );
}

export async function deleteMovie(userId: string, id: string) {
  await ensureOwnedMovie(userId, id);
  await prisma.$transaction(async (tx) => {
    const Repo = moviesRepo(tx);
    await Repo.remove({ id });
  });
  enqueueMovieRankRecompute();
}

export async function setPoster(userId: string, id: string, mediaId: string) {
  await ensureOwnedMovie(userId, id);
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) throw new HttpError(404, "Media not found", "not_found");
  if (media.ownerUserId && media.ownerUserId !== userId) throw new HttpError(403, "Forbidden", "forbidden");
  const Repo = moviesRepo();
  return Repo.setPoster({ id }, mediaId);
}

export async function suggestMovies(q: string) {
  if (!q.trim()) return [];
  const Repo = moviesRepo();
  return Repo.suggest(q);
}

