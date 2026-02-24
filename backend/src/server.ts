import "dotenv/config";
import app from "@/app.js";
import { prisma } from "@/db.js";
import { logger } from "@config/logger.js";
import process from "node:process";
import { config } from "@config/index.js";
import { recomputeMovieRanks } from "@services/movies.js";

const port = config.port;

async function start() {
  try {
    await prisma.$connect();
    logger.info("DB connected");
    await recomputeMovieRanks(prisma);
  } catch (err: any) {
    logger.error({ err }, "DB connection failed");
  }

  if (config.isProd) {
    if (!config.redisUrl) {
      logger.warn("REDIS_URL not set in production; server-side caching and redis rate limit disabled");
    }
    if (!config.storage.s3) {
      logger.warn("S3 not configured in production; media stored in Postgres (not recommended for scale)");
    }
    if (!config.cors.origins || config.cors.origins.length === 0) {
      logger.warn("CORS_ORIGINS not set in production; no origins will be allowed");
    }
    if (!config.cookies.domain) {
      logger.warn("COOKIE_DOMAIN not set in production; cookies will be host-only");
    }
  }

  let server: import("node:http").Server;
  const listen = () =>
    new Promise<void>((resolve, reject) => {
      server = app.listen(port, () => resolve());
      server.on("error", (err: any) => reject(err));
    });

  try {
    await listen();
  } catch (err: any) {
    if (err?.code === "EADDRINUSE") {
      logger.error({ port }, "Port busy; cannot start server");
      process.exit(1);
    } else {
      throw err;
    }
  }

  logger.info({ port }, "Server running");

  const shutdown = async (code = 0) => {
    logger.info("Shutting down");
    try {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    } catch {}
    try {
      await prisma.$disconnect();
    } catch {}
    process.exit(code);
  };

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
  process.on("unhandledRejection", () => shutdown(1));
  process.on("uncaughtException", () => shutdown(1));
}

start();
