import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const envSnapshot = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...envSnapshot };
});

afterEach(() => {
  process.env = { ...envSnapshot };
});

describe("config", () => {
  it("normalizes COOKIE_DOMAIN from url", async () => {
    process.env.COOKIE_DOMAIN = "https://example.com";
    const { config } = await import("../../src/config/index.js");
    expect(config.cookies.domain).toBe("example.com");
  });

  it("strips leading dots from COOKIE_DOMAIN", async () => {
    process.env.COOKIE_DOMAIN = ".example.com";
    const { config } = await import("../../src/config/index.js");
    expect(config.cookies.domain).toBe("example.com");
  });

  it("returns undefined for invalid COOKIE_DOMAIN", async () => {
    process.env.COOKIE_DOMAIN = "example.com:3000";
    const { config } = await import("../../src/config/index.js");
    expect(config.cookies.domain).toBeUndefined();
  });

  it("requires JWT secrets in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    await expect(import("../../src/config/index.js")).rejects.toThrow();
  });
});
