import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

const router = Router();

const upsertBody = z.object({
  movieId: z.string().uuid(),
  value: z.coerce.number().int().min(1).max(5)
});

router.post("/", requireAuth(), validate({ body: upsertBody }), async (req, res, next) => {
  try {
    const { movieId, value } = req.body as z.infer<typeof upsertBody>;
    const movie = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
    if (!movie) throw new HttpError(404, "Movie not found", "not_found");
    const result = await prisma.$transaction(async (tx) => {
      await tx.rating.upsert({
        where: { movieId_userId: { movieId, userId: req.user!.id } },
        update: { value },
        create: { movieId, userId: req.user!.id, value }
      });
      const agg = await tx.rating.aggregate({
        where: { movieId },
        _avg: { value: true }
      });
      const avg = Number(agg._avg.value ?? 0);
      const updatedMovie = await tx.movie.update({
        where: { id: movieId },
        data: { averageRating: avg }
      });
      return updatedMovie;
    });
    res.json({ success: true, data: { averageRating: result.averageRating } });
  } catch (e) {
    next(e);
  }
});

const idParam = z.object({ movieId: z.string().uuid() });
router.get("/:movieId", requireAuth(), validate({ params: idParam }), async (req, res, next) => {
  try {
    const { movieId } = req.params as any;
    const r = await prisma.rating.findUnique({
      where: { movieId_userId: { movieId, userId: req.user!.id } }
    });
    res.json({ success: true, data: { value: r?.value ?? null } });
  } catch (e) {
    next(e);
  }
});

export default router;
