import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { validate } from "../../src/middleware/validate.js";

const createRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as any;
};

describe("validate middleware", () => {
  it("parses body, query, and params then calls next", () => {
    const handler = validate({
      body: z.object({ name: z.string().min(1) }),
      query: z.object({ page: z.coerce.number().int().positive() }),
      params: z.object({ id: z.string().min(1) })
    });

    const req: any = { body: { name: "a" }, query: { page: "2" }, params: { id: "m1" } };
    const res = createRes();
    const next = vi.fn();

    handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ name: "a" });
    expect(req.query).toEqual({ page: 2 });
    expect(req.params).toEqual({ id: "m1" });
  });

  it("returns 400 with validation_error payload", () => {
    const handler = validate({
      body: z.object({ name: z.string().min(2) })
    });

    const req: any = { body: { name: "a" }, query: {}, params: {} };
    const res = createRes();
    const next = vi.fn();

    handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "validation_error", message: "Invalid request", details: expect.anything() }
    });
  });
});
