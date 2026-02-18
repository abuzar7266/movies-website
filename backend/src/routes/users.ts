import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth(), async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, role: true } });
  res.json({ success: true, data: me });
});

const updateBody = z.object({
  name: z.string().min(1)
});
router.patch("/me", requireAuth(), validate({ body: updateBody }), async (req, res) => {
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: (req.body as any).name },
    select: { id: true, name: true, email: true, role: true }
  });
  res.json({ success: true, data: updated });
});

export default router;
