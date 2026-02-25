import { HttpError } from "@middleware/errors.js";
import { moviesRepo } from "@repositories/movies.js";
import { prisma } from "@/db.js";
import type { Prisma, PrismaClient } from "@generated/prisma/client.js";
import { bumpCacheVersion } from "@/redisClient.js";
import { config } from "@config/index.js";

type MovieListItem = Awaited<ReturnType<ReturnType<typeof moviesRepo>["findMany"]>>[number];

let recomputeInFlight: Promise<void> | null = null;
let recomputeQueued = false;

// kept for possible admin maintenance tasks if needed in the future
async function _computeMovieRankMap(
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
  const limit = Math.max(1, Number(config.rank.recomputeLimit) || 200);
  // Determine top N by ordering keys
  const top = await client.movie.findMany({
    select: { id: true },
    orderBy: [{ reviewCount: "desc" }, { averageRating: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    take: limit
  });
  const topIds = new Set(top.map(m => m.id));
  // Existing ranks within the window
  const existing = await client.movie.findMany({
    where: { rank: { gt: 0, lte: limit } },
    select: { id: true, rank: true }
  });
  const updates: Array<Promise<unknown>> = [];
  // Update expected ranks for current top window
  top.forEach((m, i) => {
    const expected = i + 1;
    const curr = existing.find(e => e.id === m.id)?.rank ?? 0;
    if (curr !== expected) {
      updates.push(client.movie.update({ where: { id: m.id }, data: { rank: expected } }));
    }
  });
  // Clear ranks that fell out of the window
  existing.forEach((e) => {
    if (!topIds.has(e.id)) {
      updates.push(client.movie.update({ where: { id: e.id }, data: { rank: 0 } }));
    }
  });
  await Promise.all(updates);
}

export function enqueueMovieRankRecompute() {
  if (config.isTest) return;
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
  const movie = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
  await bumpCacheVersion("v:movies");
  return movie;
}

export async function getMovieOrThrow(id: string, userId?: string) {
  const Repo = moviesRepo();
  const movie = await Repo.findUnique({ id });
  if (!movie) throw new HttpError(404, "Movie not found", "not_found");
  const myRating =
    userId
      ? (await prisma.rating.findUnique({ where: { movieId_userId: { movieId: id, userId } }, select: { value: true } }))?.value ?? null
      : undefined;
  if (movie.rank === 0) {
    const rank = await computeRankForMovie(movie.id);
    return { ...movie, rank, myRating };
  }
  return { ...movie, myRating };
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
  const { total, items } = await prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<{ total: number; items: MovieListItem[] }> => {
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

  const userRatings =
    opts.userId && items.length
      ? await prisma.rating.findMany({
          where: { userId: opts.userId, movieId: { in: items.map((m: MovieListItem) => m.id) } },
          select: { movieId: true, value: true }
        })
      : [];
  const ratingByMovieId = new Map<string, number>();
  (userRatings as Array<{ movieId: string; value: number }>).forEach((r: { movieId: string; value: number }) =>
    ratingByMovieId.set(r.movieId, r.value)
  );

  if (items.some((m: MovieListItem) => m.rank === 0)) {
    const zeroIds = items.filter((m: MovieListItem) => m.rank === 0).map((m: MovieListItem) => m.id);
    const ranks = await Promise.all(zeroIds.map((id: string) => computeRankForMovie(id)));
    const rankById = new Map<string, number>();
    zeroIds.forEach((id: string, idx: number) => rankById.set(id, ranks[idx]));
    const patched = items.map((m: MovieListItem) => ({
      ...m,
      rank: m.rank === 0 ? (rankById.get(m.id) ?? 0) : m.rank,
      myRating: opts.userId ? (ratingByMovieId.get(m.id) ?? null) : undefined
    }));
    // Ensure correct ordering when sorting by rank_asc: push zero/unknown ranks to the end
    const finalItems =
      opts.sort === "rank_asc"
        ? [...patched].sort((a, b) => {
            const ar = a.rank && a.rank > 0 ? a.rank : Number.MAX_SAFE_INTEGER;
            const br = b.rank && b.rank > 0 ? b.rank : Number.MAX_SAFE_INTEGER;
            if (ar !== br) return ar - br;
            const ad = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
            const bd = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
            if (ad !== bd) return bd - ad;
            return a.id.localeCompare(b.id);
          })
        : patched;
    return { items: finalItems, total, page: opts.page, pageSize: opts.pageSize };
  }
  return {
    items: items.map((m: MovieListItem) => ({
      ...m,
      myRating: opts.userId ? (ratingByMovieId.get(m.id) ?? null) : undefined
    })),
    total,
    page: opts.page,
    pageSize: opts.pageSize
  };
}

async function computeRankForMovie(id: string, client: Prisma.TransactionClient | PrismaClient = prisma): Promise<number> {
  const m = await client.movie.findUnique({
    where: { id },
    select: { id: true, reviewCount: true, averageRating: true, createdAt: true }
  });
  if (!m) return 0;
  const better = await client.movie.count({
    where: {
      OR: [
        { reviewCount: { gt: m.reviewCount } },
        {
          AND: [
            { reviewCount: m.reviewCount },
            { averageRating: { gt: m.averageRating } }
          ]
        },
        {
          AND: [
            { reviewCount: m.reviewCount },
            { averageRating: m.averageRating },
            { createdAt: { gt: m.createdAt } }
          ]
        },
        {
          AND: [
            { reviewCount: m.reviewCount },
            { averageRating: m.averageRating },
            { createdAt: m.createdAt },
            { id: { lt: m.id } } // id asc as final tie-breaker
          ]
        }
      ]
    }
  });
  return better + 1;
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
  const updated = await Repo.update(
    { id },
    {
      title: updates.title ?? undefined,
      releaseDate: updates.releaseDate ? new Date(updates.releaseDate) : undefined,
      trailerUrl: updates.trailerUrl ?? undefined,
      synopsis: updates.synopsis ?? undefined,
      posterUrl: updates.posterUrl ?? undefined
    }
  );
  await bumpCacheVersion("v:movies");
  return updated;
}

export async function deleteMovie(userId: string, id: string) {
  await ensureOwnedMovie(userId, id);
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const Repo = moviesRepo(tx);
    await Repo.remove({ id });
  });
  enqueueMovieRankRecompute();
  await bumpCacheVersion("v:movies");
}

export async function setPoster(userId: string, id: string, mediaId: string) {
  await ensureOwnedMovie(userId, id);
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) throw new HttpError(404, "Media not found", "not_found");
  if (media.ownerUserId && media.ownerUserId !== userId) throw new HttpError(403, "Forbidden", "forbidden");
  const Repo = moviesRepo();
  const updated = await Repo.setPoster({ id }, mediaId);
  await bumpCacheVersion("v:movies");
  return updated;
}

export async function suggestMovies(q: string) {
  if (!q.trim()) return [];
  const Repo = moviesRepo();
  return Repo.suggest(q);
}

