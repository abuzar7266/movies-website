import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

const router = Router();

const createBody = z.object({
  title: z.string().min(1),
  releaseDate: z.string().datetime(),
  trailerUrl: z.string().url().optional().default(""),
  synopsis: z.string().min(1)
});

router.post("/", requireAuth(), validate({ body: createBody }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createBody>;
    const exists = await prisma.movie.findUnique({ where: { title: body.title } });
    if (exists) throw new HttpError(409, "Movie title already exists", "title_taken");
    const created = await prisma.movie.create({
      data: {
        title: body.title,
        releaseDate: new Date(body.releaseDate),
        trailerUrl: body.trailerUrl || "",
        synopsis: body.synopsis,
        createdBy: req.user!.id
      },
      select: { id: true, title: true, releaseDate: true, synopsis: true, createdAt: true, averageRating: true, reviewCount: true }
    });
    res.json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

router.get("/suggest", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    if (!q || q.trim() === "") {
      res.json({ success: true, data: [] });
      return;
    }
    const items = await prisma.movie.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      orderBy: [{ reviewCount: "desc" }, { averageRating: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, posterMediaId: true }
    });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

const idParam = z.object({ id: z.string().uuid() });

router.get("/:id", validate({ params: idParam }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const movie = await prisma.movie.findUnique({ where: { id } });
    if (!movie) throw new HttpError(404, "Movie not found", "not_found");
    res.json({ success: true, data: movie });
  } catch (e) {
    next(e);
  }
});

const updateBody = z.object({
  title: z.string().min(1).optional(),
  releaseDate: z.string().datetime().optional(),
  trailerUrl: z.string().url().optional(),
  synopsis: z.string().min(1).optional()
});
router.patch("/:id", requireAuth(), validate({ params: idParam, body: updateBody }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const body = req.body as z.infer<typeof updateBody>;
    const movie = await prisma.movie.findUnique({ where: { id } });
    if (!movie) throw new HttpError(404, "Movie not found", "not_found");
    if (movie.createdBy !== req.user!.id) throw new HttpError(403, "Forbidden", "forbidden");
    if (body.title && body.title !== movie.title) {
      const exists = await prisma.movie.findUnique({ where: { title: body.title } });
      if (exists) throw new HttpError(409, "Movie title already exists", "title_taken");
    }
    const updated = await prisma.movie.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined,
        trailerUrl: body.trailerUrl ?? undefined,
        synopsis: body.synopsis ?? undefined
      }
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth(), validate({ params: idParam }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const movie = await prisma.movie.findUnique({ where: { id } });
    if (!movie) throw new HttpError(404, "Movie not found", "not_found");
    if (movie.createdBy !== req.user!.id) throw new HttpError(403, "Forbidden", "forbidden");
    await prisma.movie.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const minStarsRaw = typeof req.query.minStars === "string" ? req.query.minStars : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : "uploaded_desc";
    const reviewScope = typeof req.query.reviewScope === "string" ? req.query.reviewScope : "all";
    const page = Number.parseInt(typeof req.query.page === "string" ? req.query.page : "1", 10) || 1;
    const pageSize = Number.parseInt(typeof req.query.pageSize === "string" ? req.query.pageSize : "12", 10) || 12;
    const minStars = minStarsRaw ? Number(minStarsRaw) : undefined;
    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { synopsis: { contains: q, mode: "insensitive" } }
      ];
    }
    if (typeof minStars === "number" && !Number.isNaN(minStars)) {
      where.averageRating = { gte: minStars };
    }
    if (reviewScope !== "all" && req.user?.id) {
      if (reviewScope === "mine") {
        where.reviews = { some: { userId: req.user.id } };
      } else if (reviewScope === "not_mine") {
        where.NOT = { reviews: { some: { userId: req.user.id } } };
      }
    }
    const orderBy =
      sort === "reviews_desc"
        ? { reviewCount: "desc" as const }
        : sort === "rating_desc"
        ? { averageRating: "desc" as const }
        : sort === "release_desc"
        ? { releaseDate: "desc" as const }
        : sort === "release_asc"
        ? { releaseDate: "asc" as const }
        : { createdAt: "desc" as const };

    const [total, items] = await prisma.$transaction([
      prisma.movie.count({ where }),
      prisma.movie.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);
    res.json({ success: true, data: { items, total, page, pageSize } });
  } catch (e) {
    next(e);
  }
});

 

const posterBody = z.object({ mediaId: z.string().uuid() });
router.patch("/:id/poster", requireAuth(), validate({ params: idParam, body: posterBody }), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const { mediaId } = req.body as any;
    const movie = await prisma.movie.findUnique({ where: { id } });
    if (!movie) throw new HttpError(404, "Movie not found", "not_found");
    if (movie.createdBy !== req.user!.id) throw new HttpError(403, "Forbidden", "forbidden");
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new HttpError(404, "Media not found", "not_found");
    if (media.ownerUserId && media.ownerUserId !== req.user!.id) throw new HttpError(403, "Forbidden", "forbidden");
    const updated = await prisma.movie.update({ where: { id }, data: { posterMediaId: mediaId } });
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
