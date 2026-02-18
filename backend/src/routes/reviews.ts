import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

const router = Router();

const createBody = z.object({
  movieId: z.string().uuid(),
  content: z.string().min(1)
});

router.post("/", requireAuth(), validate({ body: createBody }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createBody>;
    const movie = await prisma.movie.findUnique({ where: { id: body.movieId }, select: { id: true } });
    if (!movie) throw new HttpError(404, "Movie not found", "not_found");
    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: { movieId: body.movieId, userId: req.user!.id, content: body.content }
      });
      await tx.movie.update({
        where: { id: body.movieId },
        data: { reviewCount: { increment: 1 } }
      });
      return review;
    });
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
    const [total, items] = await prisma.$transaction([
      prisma.review.count({ where: { movieId } }),
      prisma.review.findMany({
        where: { movieId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);
    res.json({ success: true, data: { items, total, page, pageSize } });
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
    const updatedCount = await prisma.review.updateMany({
      where: { id, userId: req.user!.id },
      data: { content }
    });
    if (updatedCount.count === 0) throw new HttpError(404, "Review not found", "not_found");
    const updated = await prisma.review.findUnique({ where: { id } });
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth(), validate({ params: idParam }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    await prisma.$transaction(async (tx) => {
      const r = await tx.review.findFirst({ where: { id, userId: req.user!.id } });
      if (!r) throw new HttpError(404, "Review not found", "not_found");
      await tx.review.delete({ where: { id } });
      await tx.movie.update({
        where: { id: r.movieId },
        data: { reviewCount: { decrement: 1 } }
      });
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
