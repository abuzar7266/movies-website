import { Router } from "express";
import multer from "multer";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import crypto from "crypto";
import { HttpError } from "../middleware/errors.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.post("/", requireAuth(), upload.single("file"), async (req, res, next) => {
  try {
    const f = req.file;
    if (!f) throw new HttpError(400, "file is required", "validation_error");
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowed.includes(f.mimetype)) throw new HttpError(400, "unsupported file type", "validation_error");
    const media = await prisma.media.create({
      data: {
        contentType: f.mimetype,
        size: f.size,
        data: Uint8Array.from(f.buffer),
        ownerUserId: req.user?.id
      },
      select: { id: true, contentType: true, size: true, createdAt: true }
    });
    res.json({ success: true, data: { ...media, url: `/media/${media.id}` } });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new HttpError(404, "Media not found", "not_found");
    const hash = crypto.createHash("sha1").update(media.data).digest("hex");
    const etag = `"sha1-${hash}"`;
    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }
    res.setHeader("Content-Type", media.contentType);
    res.setHeader("Content-Length", media.size.toString());
    res.setHeader("ETag", etag);
    res.send(Buffer.from(media.data));
  } catch (e) {
    next(e);
  }
});

export default router;
