import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { validate } from "@middleware/validate.js";
import { requireAuth } from "@middleware/auth.js";
import { movies as Movies } from "@services/index.js";
import { getCacheVersion, getRedisClient } from "@/redis.js";

const router = Router();

import { createMovieBody as createBody, updateMovieBody as updateBody, movieIdParam as idParam, posterBody } from "@dtos/movies.js";

function etagFor(body: string) {
  const hash = crypto.createHash("sha1").update(body).digest("hex");
  return `"sha1-${hash}"`;
}

async function sendJsonWithCache(
  req: any,
  res: any,
  cacheKey: string,
  ttlSec: number,
  cacheControl: string,
  computeBody: () => Promise<any>
) {
  const client = await getRedisClient();
  if (client) {
    const cached = await client.get(cacheKey);
    if (cached) {
      const etag = etagFor(cached);
      res.setHeader("Cache-Control", cacheControl);
      res.setHeader("ETag", etag);
      if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return;
      }
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).send(cached);
      return;
    }
  }

  const body = await computeBody();
  const json = JSON.stringify(body);
  const etag = etagFor(json);
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("ETag", etag);
  if (req.headers["if-none-match"] === etag) {
    res.status(304).end();
    return;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(json);
  if (client) {
    client.setEx(cacheKey, ttlSec, json).catch(() => {});
  }
}

router.post("/", requireAuth(), validate({ body: createBody }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createBody>;
    const created = await Movies.createMovie(req.user!.id, body);
    res.json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

router.get("/suggest", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    if (!q || q.trim() === "") return res.json({ success: true, data: [] });
    const items = await Movies.suggestMovies(q);
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", validate({ params: idParam }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    res.setHeader("Vary", "Cookie");
    const version = await getCacheVersion("v:movies");
    const userKey = req.user?.id ?? "anon";
    const cacheKey = `cache:movies:detail:v${version}:${id}:${userKey}`;
    await sendJsonWithCache(req, res, cacheKey, 30, "private, max-age=30", async () => {
      const movie = await Movies.getMovieOrThrow(id, req.user?.id);
      return { success: true, data: movie };
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth(), validate({ params: idParam, body: updateBody }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const body = req.body as z.infer<typeof updateBody>;
    const updated = await Movies.updateMovie(req.user!.id, id, body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth(), validate({ params: idParam }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    await Movies.deleteMovie(req.user!.id, id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const minStars = typeof req.query.minStars === "string" ? req.query.minStars : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const reviewScope = typeof req.query.reviewScope === "string" ? req.query.reviewScope : "all";
    const page = typeof req.query.page === "string" ? req.query.page : undefined;
    const pageSize = typeof req.query.pageSize === "string" ? req.query.pageSize : undefined;
    const pageNum = Number.parseInt(page ?? "1", 10) || 1;
    const pageSizeNum = Number.parseInt(pageSize ?? "12", 10) || 12;
    const minStarsNum = typeof minStars === "string" && minStars !== "" ? Number(minStars) : undefined;
    res.setHeader("Vary", "Cookie");
    const version = await getCacheVersion("v:movies");
    const userKey = req.user?.id ?? "anon";
    const qKey = q ? encodeURIComponent(q) : "";
    const sortKey = sort ? encodeURIComponent(sort) : "";
    const scopeKey = reviewScope ? encodeURIComponent(reviewScope) : "all";
    const minStarsKey = typeof minStarsNum === "number" && !Number.isNaN(minStarsNum) ? String(minStarsNum) : "";
    const cacheKey = `cache:movies:list:v${version}:q=${qKey}&minStars=${minStarsKey}&sort=${sortKey}&scope=${scopeKey}&page=${pageNum}&pageSize=${pageSizeNum}&user=${userKey}`;
    await sendJsonWithCache(req, res, cacheKey, 30, "private, max-age=30", async () => {
      const result = await Movies.listMovies({
        q: q,
        minStars: minStarsNum,
        reviewScope: reviewScope as any,
        sort: sort as any,
        page: pageNum,
        pageSize: pageSizeNum,
        userId: req.user?.id
      });
      return { success: true, data: result };
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/poster", requireAuth(), validate({ params: idParam, body: posterBody }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const { mediaId } = req.body as any;
    const updated = await Movies.setPoster(req.user!.id, id, mediaId);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
