import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../src/auth/jwt.js";

describe("jwt", () => {
  it("signs and verifies access token", () => {
    const token = signAccessToken("u1", "admin");
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("u1");
    expect(payload.role).toBe("admin");
  });

  it("signs and verifies refresh token", () => {
    const token = signRefreshToken("u2", "user");
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe("u2");
    expect(payload.role).toBe("user");
  });

  it("rejects token signed with wrong secret", () => {
    const token = jwt.sign({ sub: "u1", role: "admin" }, "wrong-secret", { expiresIn: 60 });
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
