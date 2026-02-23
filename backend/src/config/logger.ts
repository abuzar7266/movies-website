import pino from "pino";
import { config } from "@config/index.js";

export const logger = pino(
  config.isProd
    ? { level: config.logLevel }
    : {
        level: config.logLevel,
        transport: {
          target: "pino-pretty",
          options: { translateTime: "SYS:standard", colorize: true, singleLine: true }
        }
      }
);
