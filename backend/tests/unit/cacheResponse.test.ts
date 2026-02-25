import { describe, it, expect, vi } from "vitest";

const getMock = vi.fn<[], any>();
const setExMock = vi.fn<[], any>();

vi.mock("../../src/redisClient.js", () => ({
  getRedisClient: vi.fn(async () => ({
    get: getMock,
    setEx: setExMock
  }))
}));

import { sendJsonWithCache, etagFor } from "../../src/middleware/cacheResponse.js";

function makeReq(headers: Record<string, string> = {}) {
  return { headers };
}
function makeRes() {
  const headers: Record<string, string> = {};
  return {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(k: string, v: string) {
      headers[k.toLowerCase()] = v;
    },
    sent: "",
    send(body: string) {
      this.sent = body;
    },
    end() {
      this.sent = "";
    },
    headers
  } as any;
}

describe("sendJsonWithCache", () => {
  it("returns cached body when present", async () => {
    getMock.mockResolvedValueOnce(JSON.stringify({ ok: true }));
    const req = makeReq();
    const res = makeRes();
    await sendJsonWithCache(req, res, "k", 10, "public, max-age=10", async () => ({ ok: false }));
    expect(res.statusCode).toBe(200);
    expect(res.sent).toBe(JSON.stringify({ ok: true }));
  });

  it("returns 304 when If-None-Match matches", async () => {
    const body = JSON.stringify({ a: 1 });
    getMock.mockResolvedValueOnce(body);
    const etag = etagFor(body);
    const req = makeReq({ "if-none-match": etag });
    const res = makeRes();
    await sendJsonWithCache(req, res, "k2", 10, "public, max-age=10", async () => ({ a: 2 }));
    expect(res.statusCode).toBe(304);
    expect(res.sent).toBe("");
  });

  it("computes, sends, and stores when not cached", async () => {
    getMock.mockResolvedValueOnce(null);
    setExMock.mockResolvedValueOnce(undefined);
    const req = makeReq();
    const res = makeRes();
    await sendJsonWithCache(req, res, "k3", 5, "public, max-age=5", async () => ({ x: 1 }));
    expect(res.statusCode).toBe(200);
    expect(res.sent).toBe(JSON.stringify({ x: 1 }));
    expect(setExMock).toHaveBeenCalled();
  });

  it("computes but returns 304 when request etag matches", async () => {
    getMock.mockResolvedValueOnce(null);
    setExMock.mockResolvedValueOnce(undefined);
    const body = JSON.stringify({ y: 2 });
    const etag = etagFor(body);
    const req = makeReq({ "if-none-match": etag });
    const res = makeRes();
    await sendJsonWithCache(req, res, "k4", 5, "public, max-age=5", async () => ({ y: 2 }));
    expect(res.statusCode).toBe(304);
    expect(res.sent).toBe("");
  });
});
