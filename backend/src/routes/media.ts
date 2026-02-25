import { Router } from "express";
import multer from "multer";
import { prisma } from "@/db.js";
import { requireAuth } from "@middleware/auth.js";
import crypto from "crypto";
import { HttpError } from "@middleware/errors.js";
import { config } from "@config/index.js";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { bumpCacheVersion } from "@/redisClient.js";
import type { Prisma } from "@generated/prisma/client.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

let s3: S3Client | undefined;
if (config.storage.s3) {
  s3 = new S3Client({
    region: config.storage.s3.region,
    endpoint: config.storage.s3.endpoint,
    forcePathStyle: config.storage.s3.forcePathStyle,
    credentials:
      config.storage.s3.accessKeyId && config.storage.s3.secretAccessKey
        ? { accessKeyId: config.storage.s3.accessKeyId, secretAccessKey: config.storage.s3.secretAccessKey }
        : undefined
  });
}

router.post("/", requireAuth(), upload.single("file"), async (req, res, next) => {
  try {
    const f = req.file;
    if (!f) throw new HttpError(400, "file is required", "validation_error");
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowed.includes(f.mimetype)) throw new HttpError(400, "unsupported file type", "validation_error");
    if (s3 && config.storage.s3) {
      const media = await prisma.media.create({
        data: {
          contentType: f.mimetype,
          size: f.size,
          ownerUserId: req.user?.id
        },
        select: { id: true, contentType: true, size: true, createdAt: true }
      });
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: config.storage.s3.bucket,
            Key: media.id,
            Body: f.buffer,
            ContentType: f.mimetype,
            CacheControl: "public, max-age=31536000, immutable"
          })
        );
      } catch (err) {
        await prisma.media.delete({ where: { id: media.id } }).catch(() => {});
        throw err;
      }
      res.json({ success: true, data: { ...media, url: `/media/${media.id}` } });
    } else {
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
    }
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new HttpError(404, "Media not found", "not_found");
    if (s3 && config.storage.s3 && media.data == null) {
      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: config.storage.s3.bucket, Key: id }));
        const etag = head.ETag;
        if (etag && req.headers["if-none-match"] === etag) {
          res.status(304).end();
          return;
        }
        const obj = await s3.send(new GetObjectCommand({ Bucket: config.storage.s3.bucket, Key: id }));
        res.setHeader("Content-Type", media.contentType);
        if (etag) res.setHeader("ETag", etag);
        if (head.ContentLength !== undefined) res.setHeader("Content-Length", head.ContentLength.toString());
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        const body = obj.Body as Readable;
        body.pipe(res);
      } catch {
        throw new HttpError(404, "Media not found", "not_found");
      }
    } else {
      const hash = crypto.createHash("sha1").update(media.data as Buffer).digest("hex");
      const etag = `"sha1-${hash}"`;
      if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return;
      }
      res.setHeader("Content-Type", media.contentType);
      res.setHeader("Content-Length", media.size.toString());
      res.setHeader("ETag", etag);
      res.send(Buffer.from(media.data as Buffer));
    }
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth(), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new HttpError(404, "Media not found", "not_found");
    const user = req.user!;
    const isOwner = media.ownerUserId ? media.ownerUserId === user.id : true;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Forbidden", "forbidden");
    if (s3 && config.storage.s3 && media.data == null) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: config.storage.s3.bucket, Key: id as string }));
      } catch {
        // ignore delete errors to avoid leaking DB rows
      }
    }
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.movie.updateMany({ where: { posterMediaId: id }, data: { posterMediaId: null, posterUrl: null } });
      await tx.user.updateMany({ where: { avatarMediaId: id }, data: { avatarMediaId: null } });
      await tx.media.delete({ where: { id } });
    });
    await bumpCacheVersion("v:movies");
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
