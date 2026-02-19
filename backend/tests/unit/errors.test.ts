import { describe, it, expect, vi, beforeEach } from "vitest";

const loggerMocks = vi.hoisted(() => ({
  logger: {
    error: vi.fn()
  }
}));

vi.mock("../../src/config/logger.js", () => loggerMocks);

import { errorHandler, notFound, HttpError } from "../../src/middleware/errors.js";

const createRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as any;
};

describe("errors middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notFound returns 404", () => {
    const res = createRes();
    notFound({} as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: "not_found", message: "Not found" } });
  });

  it("errorHandler returns HttpError payload", () => {
    const res = createRes();
    errorHandler(new HttpError(400, "Bad", "bad_request"), {} as any, res, (() => {}) as any);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: "bad_request", message: "Bad" } });
    expect(loggerMocks.logger.error).not.toHaveBeenCalled();
  });

  it("errorHandler logs on 500", () => {
    const res = createRes();
    errorHandler(new Error("Boom"), {} as any, res, (() => {}) as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: "internal_error", message: "Boom" } });
    expect(loggerMocks.logger.error).toHaveBeenCalledTimes(1);
  });
});
