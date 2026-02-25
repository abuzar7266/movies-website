import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("../../src/config/index.js", () => ({
  config: {
    isTest: false,
    isProd: false,
    logLevel: "silent",
    cookies: { secure: false, sameSite: "lax", domain: undefined }
  }
}));

import { csrfProtection } from "../../src/middleware/csrf.js";

function makeReq(init: Partial<Request> = {}): any {
  return {
    method: "POST",
    path: "/users",
    cookies: {},
    get: (h: string) => undefined,
    headers: {},
    ...init
  };
}

function makeRes(): any {
  return {};
}

function makeNext(cb: (err?: any) => void): NextFunction {
  return ((err?: any) => cb(err)) as NextFunction;
}

describe("csrfProtection", () => {
  it("allows safe methods", async () => {
    const req = makeReq({ method: "GET" });
    const res = makeRes();
    await new Promise<void>((resolve, reject) => {
      csrfProtection(req, res, makeNext((err) => (err ? reject(err) : resolve())));
    });
  });

  it("allows exempt paths", async () => {
    const req = makeReq({ path: "/auth/login" });
    const res = makeRes();
    await new Promise<void>((resolve, reject) => {
      csrfProtection(req, res, makeNext((err) => (err ? reject(err) : resolve())));
    });
  });

  it("rejects when header missing", async () => {
    const req = makeReq({ cookies: { csrf_token: "abc" } });
    const res = makeRes();
    await new Promise<void>((resolve) => {
      csrfProtection(req, res, makeNext((err) => {
        expect(err).toBeTruthy();
        resolve();
      }));
    });
  });

  it("rejects when cookie and header mismatch", async () => {
    const req = makeReq({
      cookies: { csrf_token: "abc" },
      get: (h: string) => (h.toLowerCase() === "x-csrf-token" ? "def" : undefined)
    });
    const res = makeRes();
    await new Promise<void>((resolve) => {
      csrfProtection(req, res, makeNext((err) => {
        expect(err).toBeTruthy();
        resolve();
      }));
    });
  });

  it("passes when cookie and header match", async () => {
    const req = makeReq({
      cookies: { csrf_token: "abc" },
      get: (h: string) => (h.toLowerCase() === "x-csrf-token" ? "abc" : undefined)
    });
    const res = makeRes();
    await new Promise<void>((resolve, reject) => {
      csrfProtection(req, res, makeNext((err) => (err ? reject(err) : resolve())));
    });
  });
});
