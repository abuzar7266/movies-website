import { describe, it, expect, vi } from "vitest";
import { redisRateLimit } from "../../src/middleware/redisRateLimit.js";

const getRedisClient = vi.fn();
vi.mock("../../src/redisClient.js", () => ({
  getRedisClient: () => getRedisClient()
}));

function makeReq(ip = "127.0.0.1"): any {
  return { ip };
}
function makeRes(): any {
  return {
    code: 0,
    body: null as any,
    status(c: number) {
      this.code = c;
      return this;
    },
    json(b: any) {
      this.body = b;
    }
  };
}

describe("redisRateLimit", () => {
  it("passes through when client unavailable", async () => {
    getRedisClient.mockResolvedValueOnce(undefined);
    const mw = redisRateLimit({ windowMs: 1000, limit: 2 });
    const req = makeReq();
    const res = makeRes();
    await new Promise<void>((resolve, reject) => {
      mw(req, res, (err) => (err ? reject(err) : resolve()));
    });
  });

  it("sets expiry on first hit and allows within limit", async () => {
    const incr = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const pExpire = vi.fn().mockResolvedValueOnce(undefined);
    getRedisClient.mockResolvedValueOnce({ incr, pExpire });
    const mw = redisRateLimit({ windowMs: 1000, limit: 3 });
    const req = makeReq();
    const res = makeRes();
    await new Promise<void>((resolve, reject) => mw(req, res, (e) => (e ? reject(e) : resolve())));
    await new Promise<void>((resolve, reject) => mw(req, res, (e) => (e ? reject(e) : resolve())));
    expect(pExpire).toHaveBeenCalled();
    expect(res.code).toBe(0);
  });

  it("returns 429 when over limit", async () => {
    const incr = vi.fn().mockResolvedValueOnce(4);
    const pExpire = vi.fn();
    getRedisClient.mockResolvedValueOnce({ incr, pExpire });
    const mw = redisRateLimit({ windowMs: 1000, limit: 3 });
    const req = makeReq();
    const res = makeRes();
    await mw(req, res, () => {});
    expect(res.code).toBe(429);
    expect(res.body?.success).toBe(false);
  });

  it("falls through on errors", async () => {
    getRedisClient.mockRejectedValueOnce(new Error("x"));
    const mw = redisRateLimit({ windowMs: 1000, limit: 1 });
    const req = makeReq();
    const res = makeRes();
    await new Promise<void>((resolve, reject) => mw(req, res, (e) => (e ? reject(e) : resolve())));
  });
});
