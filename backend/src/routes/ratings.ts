import { Router } from "express";
import { z } from "zod";
import { validate } from "@middleware/validate.js";
import { requireAuth } from "@middleware/auth.js";
import { ratings as Ratings } from "@services/index.js";
import { upsertRatingBody as upsertBody, ratingMovieIdParam as idParam } from "@dtos/ratings.js";

const router = Router();

router.post("/", requireAuth(), validate({ body: upsertBody }), async (req, res, next) => {
  try {
    const { movieId, value } = req.body as z.infer<typeof upsertBody>;
    const result = await Ratings.upsertRating(req.user!.id, { movieId, value });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

router.get("/:movieId", requireAuth(), validate({ params: idParam }), async (req, res, next) => {
  try {
    const { movieId } = req.params as any;
    const value = await Ratings.getUserRating(req.user!.id, movieId);
    res.json({ success: true, data: { value } });
  } catch (e) {
    next(e);
  }
});

export default router;
