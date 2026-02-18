import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { ratings as Ratings } from "../services/index.js";

const router = Router();

const upsertBody = z.object({
  movieId: z.string().uuid(),
  value: z.coerce.number().int().min(1).max(5)
});

router.post("/", requireAuth(), validate({ body: upsertBody }), async (req, res, next) => {
  try {
    const { movieId, value } = req.body as z.infer<typeof upsertBody>;
    const result = await Ratings.upsertRating(req.user!.id, { movieId, value });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

const idParam = z.object({ movieId: z.string().uuid() });
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
