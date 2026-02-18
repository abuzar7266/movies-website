import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_ACCESS_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().optional(),
  JWT_REFRESH_TTL_SEC: z.coerce.number().int().positive().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  CORS_ORIGINS: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error("Invalid environment variables");
}
const env = parsed.data;
const isProd = env.NODE_ENV === "production";

const accessSecret =
  env.JWT_ACCESS_SECRET ?? (isProd ? (() => { throw new Error("JWT_ACCESS_SECRET required in production"); })() : "dev-access-secret");
const refreshSecret =
  env.JWT_REFRESH_SECRET ?? (isProd ? (() => { throw new Error("JWT_REFRESH_SECRET required in production"); })() : "dev-refresh-secret");

export const config = {
  isProd,
  port: env.PORT,
  jwt: {
    accessSecret,
    refreshSecret,
    accessTtlSec: env.JWT_ACCESS_TTL_SEC ?? 15 * 60,
    refreshTtlSec: env.JWT_REFRESH_TTL_SEC ?? 7 * 24 * 60 * 60
  },
  cookies: {
    domain: env.COOKIE_DOMAIN || undefined,
    secure: isProd,
    sameSite: ("lax" as const)
  },
  cors: {
    origins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean) : null
  }
};
