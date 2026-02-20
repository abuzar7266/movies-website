import "dotenv/config";
import app from "@/app.js";
import { prisma } from "@/db.js";
import { logger } from "@config/logger.js";
import { execSync } from "node:child_process";
import os from "node:os";
import process from "node:process";
import { config } from "@config/index.js";
import { recomputeMovieRanks } from "@services/movies.js";

const port = config.port;

function killPort(p: number) {
  try {
    if (os.platform() === "win32") {
      const output = execSync(`powershell -NoProfile -Command \"Get-NetTCPConnection -LocalPort ${p} -State Listen | Select-Object -ExpandProperty OwningProcess\"`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
      if (output) execSync(`taskkill /F /PID ${output}`, { stdio: "ignore" });
    } else {
      execSync(`sh -lc "lsof -ti tcp:${p} | xargs -r kill -9"`, { stdio: "ignore" });
    }
  } catch {}
}

async function start() {
  try {
    await prisma.$connect();
    logger.info("DB connected");
    await recomputeMovieRanks(prisma);
  } catch (err: any) {
    logger.error({ err }, "DB connection failed");
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
      logger.warn({ port }, "Port busy; attempting to free it");
      killPort(port);
      await new Promise((r) => setTimeout(r, 700));
      await listen();
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
