import type { RequestHandler } from "express";

export const requestId: RequestHandler = (req, _res, next) => {
  const headerId = req.headers["x-request-id"];
  const rid = (Array.isArray(headerId) ? headerId[0] : headerId) || crypto.randomUUID();
  (req as any).requestId = rid;
  next();
};

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

