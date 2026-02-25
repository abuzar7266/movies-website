import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

  it("reads secrets from *_FILE envs", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-"));
    const accessPath = path.join(dir, "acc.txt");
    const refreshPath = path.join(dir, "ref.txt");
    fs.writeFileSync(accessPath, "acc-secret");
    fs.writeFileSync(refreshPath, "ref-secret");
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    process.env.JWT_ACCESS_SECRET_FILE = accessPath;
    process.env.JWT_REFRESH_SECRET_FILE = refreshPath;
    const { config } = await import("../../src/config/index.js");
    expect(config.jwt.accessSecret).toBe("acc-secret");
    expect(config.jwt.refreshSecret).toBe("ref-secret");
  });

  it("parses CORS_ORIGINS to array", async () => {
    process.env.CORS_ORIGINS = "https://a.com, http://b.com ,";
    const { config } = await import("../../src/config/index.js");
    expect(config.cors.origins).toEqual(["https://a.com", "http://b.com"]);
  });

  it("builds S3 storage config with forcePathStyle", async () => {
    process.env.S3_BUCKET = "b";
    process.env.S3_REGION = "r";
    process.env.S3_ACCESS_KEY_ID = "ak";
    process.env.S3_SECRET_ACCESS_KEY = "sk";
    process.env.S3_FORCE_PATH_STYLE = "true";
    const { config } = await import("../../src/config/index.js");
    expect(config.storage.s3?.bucket).toBe("b");
    expect(config.storage.s3?.forcePathStyle).toBe(true);
  });
});
