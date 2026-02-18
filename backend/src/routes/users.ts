import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { users as Users } from "../services/index.js";
import { updateUserBody as updateBody, avatarBody } from "../dtos/users.js";

const router = Router();

router.get("/me", requireAuth(), async (req, res) => {
  const me = await Users.getUserPublic(req.user!.id);
  res.json({ success: true, data: me });
});

router.patch("/me", requireAuth(), validate({ body: updateBody }), async (req, res) => {
  const updated = await Users.updateUserName(req.user!.id, (req.body as any).name);
  res.json({ success: true, data: updated });
});

router.patch("/me/avatar", requireAuth(), validate({ body: avatarBody }), async (req, res, next) => {
  try {
    const mediaId = (req.body as any).mediaId as string | null;
    const updated = await Users.setUserAvatar(req.user!.id, mediaId);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
