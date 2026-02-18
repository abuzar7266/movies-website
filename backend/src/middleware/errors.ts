import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = "error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, error: { code: "not_found", message: "Not found" } });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const code = typeof err?.code === "string" ? err.code : "internal_error";
  const message = typeof err?.message === "string" ? err.message : "Internal server error";
  if (status >= 500) logger.error({ err }, "unhandled_error");
  res.status(status).json({ success: false, error: { code, message } });
}
