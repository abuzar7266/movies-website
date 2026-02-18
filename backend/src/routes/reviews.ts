import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";
import { reviews as Reviews } from "../services/index.js";

const router = Router();

const createBody = z.object({
  movieId: z.string().uuid(),
  content: z.string().min(1)
});

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
    const resData = await Reviews.listReviewsByMovie(movieId, page, pageSize);
    res.json({ success: true, data: resData });
  } catch (e) {
    next(e);
  }
});

const idParam = z.object({ id: z.string().uuid() });
const updateBody = z.object({
  content: z.string().min(1)
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
