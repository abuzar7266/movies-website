import { describe, it, expect, vi, beforeEach } from "vitest";

const jwtMocks = vi.hoisted(() => ({
  verifyAccessToken: vi.fn()
}));

vi.mock("../../src/auth/jwt.js", () => jwtMocks);

import { authenticate, requireAuth, requireRole } from "../../src/middleware/auth.js";
import { HttpError } from "../../src/middleware/errors.js";

describe("auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticate does nothing when cookie missing", () => {
    const req: any = { cookies: {} };
    const next = vi.fn();
    authenticate(req, {}, next);
    expect(req.user).toBeUndefined();
    expect(jwtMocks.verifyAccessToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("authenticate sets req.user when token is valid", () => {
    jwtMocks.verifyAccessToken.mockReturnValue({ sub: "u1", role: "admin" });
    const req: any = { cookies: { access_token: "tok" } };
    const next = vi.fn();
    authenticate(req, {}, next);
    expect(req.user).toEqual({ id: "u1", role: "admin" });
    expect(jwtMocks.verifyAccessToken).toHaveBeenCalledWith("tok");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("authenticate ignores invalid token", () => {
    jwtMocks.verifyAccessToken.mockImplementation(() => {
      throw new Error("bad");
    });
    const req: any = { cookies: { access_token: "tok" } };
    const next = vi.fn();
    authenticate(req, {}, next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("requireAuth returns 401 when unauthenticated", () => {
    const handler = requireAuth();
    const req: any = {};
    const next = vi.fn();
    handler(req, {}, next);
    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(401);
  });

  it("requireRole returns 403 when role mismatched", () => {
    const handler = requireRole("admin");
    const req: any = { user: { id: "u1", role: "user" } };
    const next = vi.fn();
    handler(req, {}, next);
    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(403);
  });

  it("requireRole passes when role matches", () => {
    const handler = requireRole("admin");
    const req: any = { user: { id: "u1", role: "admin" } };
    const next = vi.fn();
    handler(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});
