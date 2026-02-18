import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { movies as Movies } from "../services/index.js";

const router = Router();

import { createMovieBody as createBody, updateMovieBody as updateBody, movieIdParam as idParam, posterBody } from "../dtos/movies.js";

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
    const movie = await Movies.getMovieOrThrow(id);
    res.json({ success: true, data: movie });
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
    const result = await Movies.listMovies({
      q: q,
      minStars: minStarsNum,
      reviewScope: reviewScope as any,
      sort: sort as any,
      page: pageNum,
      pageSize: pageSizeNum,
      userId: req.user?.id
    });
    res.json({ success: true, data: result });
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
