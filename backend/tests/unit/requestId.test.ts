import { describe, it, expect, vi } from "vitest";
import { requestId } from "../../src/middleware/requestId.js";

describe("requestId middleware", () => {
  it("uses x-request-id header when provided", () => {
    const req: any = { headers: { "x-request-id": "rid-123" } };
    const next = vi.fn();
    requestId(req, {} as any, next);
    expect(req.requestId).toBe("rid-123");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("generates requestId when header is missing", () => {
    const uuid = "00000000-0000-0000-0000-000000000000";
    const spy = vi.spyOn(crypto, "randomUUID").mockReturnValue(uuid);
    const req: any = { headers: {} };
    const next = vi.fn();
    requestId(req, {} as any, next);
    expect(req.requestId).toBe(uuid);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
