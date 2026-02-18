import type { RequestHandler } from "express";
import { collectDefaultMetrics, Registry, Histogram } from "prom-client";

const register = new Registry();
collectDefaultMetrics({ register });

const httpHistogram = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

register.registerMetric(httpHistogram);

export const metricsMiddleware: RequestHandler = (req, res, next) => {
  const end = httpHistogram.startTimer();
  res.on("finish", () => {
    const route = (req.route && (req.baseUrl + req.route.path)) || req.baseUrl || req.path || "unknown";
    end({ method: req.method, route, status: String(res.statusCode) });
  });
  next();
};

export const metricsHandler: RequestHandler = async (_req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
};

