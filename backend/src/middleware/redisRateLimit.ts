import type { Request, Response, NextFunction } from "express";
import { getRedisClient } from "../redis.js";

type Options = {
  windowMs: number;
  limit: number;
};

export function redisRateLimit(options: Options) {
  const windowMs = options.windowMs;
  const limit = options.limit;
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await getRedisClient();
      if (!client) return next();
      const key = `rl:${req.ip}`;
      const val = await client.incr(key);
      if (val === 1) {
        await client.pExpire(key, windowMs);
      }
      if (val > limit) {
        res.status(429).json({ success: false, error: { code: "rate_limited", message: "Too many requests" } });
        return;
      }
      next();
    } catch {
      next();
    }
  };
}
