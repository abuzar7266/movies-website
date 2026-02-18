import { ZodTypeAny } from "zod";
import type { RequestHandler } from "express";

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validate(schemas: Schemas): RequestHandler {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) (req as any).query = schemas.query.parse(req.query);
      if (schemas.params) (req as any).params = schemas.params.parse(req.params);
      next();
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: "validation_error", message: "Invalid request", details: err?.issues ?? null } });
    }
  };
}
