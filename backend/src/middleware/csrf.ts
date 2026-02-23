import type { RequestHandler } from "express";
import crypto from "node:crypto";
import { HttpError } from "@middleware/errors.js";
import { config } from "@config/index.js";

const CSRF_COOKIE = "csrf_token";
const HEADER_NAMES = ["x-csrf-token", "x-xsrf-token"];
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);
const EXEMPT_PATHS = new Set<string>([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/openapi.json",
  "/metrics",
  "/healthz"
]);

export const csrfProtection: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const path = req.path;
  if (EXEMPT_PATHS.has(path)) return next();
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = HEADER_NAMES.map((n) => req.get(n)).find(Boolean);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new HttpError(403, "CSRF token invalid or missing", "forbidden"));
  }
  next();
};

export function issueCsrfCookie(res: import("express").Response) {
  const token = crypto.randomBytes(24).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    domain: config.cookies.domain,
    path: "/"
  });
  return token;
}
