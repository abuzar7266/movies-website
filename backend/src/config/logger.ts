import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino(
  isProd
    ? { level: process.env.LOG_LEVEL || "info" }
    : {
        level: process.env.LOG_LEVEL || "debug",
        transport: {
          target: "pino-pretty",
          options: { translateTime: "SYS:standard", colorize: true, singleLine: true }
        }
      }
);
