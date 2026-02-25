import crypto from "node:crypto";
import { getRedisClient } from "@/redisClient.js";

export function etagFor(body: string) {
  const hash = crypto.createHash("sha1").update(body).digest("hex");
  return `"sha1-${hash}"`;
}

export async function sendJsonWithCache(
  req: any,
  res: any,
  cacheKey: string,
  ttlSec: number,
  cacheControl: string,
  computeBody: () => Promise<any>
) {
  const client = await getRedisClient();
  if (client) {
    const cached = await client.get(cacheKey);
    if (cached) {
      const etag = etagFor(cached);
      res.setHeader("Cache-Control", cacheControl);
      res.setHeader("ETag", etag);
      if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return;
      }
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(200).send(cached);
      return;
    }
  }
  const body = await computeBody();
  const json = JSON.stringify(body);
  const etag = etagFor(json);
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("ETag", etag);
  if (req.headers["if-none-match"] === etag) {
    res.status(304).end();
    return;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(json);
  if (client) {
    client.setEx(cacheKey, ttlSec, json).catch(() => {});
  }
}
