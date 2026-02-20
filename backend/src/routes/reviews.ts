import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { validate } from "@middleware/validate.js";
import { requireAuth } from "@middleware/auth.js";
import { HttpError } from "@middleware/errors.js";
import { reviews as Reviews } from "@services/index.js";
import { createReviewBody as createBody, reviewIdParam as idParam, updateReviewBody as updateBody } from "@dtos/reviews.js";
import { getCacheVersion, getRedisClient } from "@/redis.js";

const router = Router();

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
    const result = await Reviews.createReview(req.user!.id, { movieId: body.movieId, content: body.content });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const movieId = typeof req.query.movieId === "string" ? req.query.movieId : undefined;
    if (!movieId) throw new HttpError(400, "movieId required", "validation_error");
    const page = Number.parseInt(typeof req.query.page === "string" ? req.query.page : "1", 10) || 1;
    const pageSize = Number.parseInt(typeof req.query.pageSize === "string" ? req.query.pageSize : "10", 10) || 10;
    const version = await getCacheVersion(`v:reviews:${movieId}`);
    const cacheKey = `cache:reviews:movie:${movieId}:v${version}:page=${page}&pageSize=${pageSize}`;
    await sendJsonWithCache(req, res, cacheKey, 30, "public, max-age=30", async () => {
      const resData = await Reviews.listReviewsByMovie(movieId, page, pageSize);
      return { success: true, data: resData };
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth(), validate({ params: idParam, body: updateBody }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const content = (req.body as any).content as string;
    const updated = await Reviews.updateReview(req.user!.id, id, content);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth(), validate({ params: idParam }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    await Reviews.deleteReview(req.user!.id, id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
