import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth(), async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, role: true, avatarMediaId: true } });
  res.json({ success: true, data: me });
});

const updateBody = z.object({
  name: z.string().min(1)
});
router.patch("/me", requireAuth(), validate({ body: updateBody }), async (req, res) => {
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: (req.body as any).name },
    select: { id: true, name: true, email: true, role: true, avatarMediaId: true }
  });
  res.json({ success: true, data: updated });
});

const avatarBody = z.object({ mediaId: z.string().uuid().nullable() });
router.patch("/me/avatar", requireAuth(), validate({ body: avatarBody }), async (req, res, next) => {
  try {
    const mediaId = (req.body as any).mediaId as string | null;
    if (mediaId) {
      const media = await prisma.media.findUnique({ where: { id: mediaId } });
      if (!media) return res.status(404).json({ success: false, error: { code: "not_found", message: "Media not found" } });
      if (media.ownerUserId && media.ownerUserId !== req.user!.id) return res.status(403).json({ success: false, error: { code: "forbidden", message: "Forbidden" } });
    }
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarMediaId: mediaId ?? null },
      select: { id: true, name: true, email: true, role: true, avatarMediaId: true }
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
