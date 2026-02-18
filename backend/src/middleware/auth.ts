import type { RequestHandler } from "express";
import { verifyAccessToken } from "../auth/jwt.js";
import { HttpError } from "./errors.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; role: string };
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.access_token;
  if (!token) return next();
  try {
    const { sub, role } = verifyAccessToken(token);
    req.user = { id: sub, role };
  } catch {}
  next();
};

export function requireAuth(): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Unauthorized", "unauthorized"));
    next();
  };
}

export function requireRole(role: string): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Unauthorized", "unauthorized"));
    if (req.user.role !== role) return next(new HttpError(403, "Forbidden", "forbidden"));
    next();
  };
}
