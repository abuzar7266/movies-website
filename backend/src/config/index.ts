import "dotenv/config";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

function loadSecretFile(envKeyFile: string, targetKey: string) {
  const p = process.env[envKeyFile];
  if (p && !process.env[targetKey]) {
    try {
      const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
      const val = fs.readFileSync(abs, "utf8").trim();
      if (val) process.env[targetKey] = val;
    } catch {}
  }
}
loadSecretFile("JWT_ACCESS_SECRET_FILE", "JWT_ACCESS_SECRET");
loadSecretFile("JWT_REFRESH_SECRET_FILE", "JWT_REFRESH_SECRET");
loadSecretFile("DATABASE_URL_FILE", "DATABASE_URL");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().optional(),
  JWT_REFRESH_TTL_SEC: z.coerce.number().int().positive().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).optional(),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_LIMIT: z.coerce.number().int().positive().optional(),
  RANK_RECOMPUTE_LIMIT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_TEST: z.string().min(1),
  REDIS_URL: z.string().optional(),
  METRICS_ENABLED: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.enum(["true", "false"]).optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  VALIDATE_ENV_STRICT: z.enum(["true", "false"]).optional()
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error("Invalid environment variables");
}
const env = parsed.data;
const isProd = env.NODE_ENV === "production";
const isDev = env.NODE_ENV === "development";
const isTest = env.NODE_ENV === "test";

const validateEnvStrict = (env.VALIDATE_ENV_STRICT === "true") || isProd || isDev;

const accessSecret = env.JWT_ACCESS_SECRET;
const refreshSecret = env.JWT_REFRESH_SECRET;

function normalizeCookieDomain(input?: string) {
  if (!input) return undefined;
  let d = input.trim();
  if (!d) return undefined;
  try {
    if (d.startsWith("http://") || d.startsWith("https://")) {
      d = new URL(d).hostname;
    }
  } catch {}
  d = d.replace(/^\.+/, "").replace(/\.+$/, "");
  if (!d) return undefined;
  if (/[\/:]/.test(d)) return undefined;
  return d;
}

// Expose both URLs; do not auto-switch based on environment
const databaseUrl = env.DATABASE_URL;
const testDatabaseUrl = env.DATABASE_URL_TEST;

if (validateEnvStrict) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set (strict env validation enabled)");
  }
  if (!testDatabaseUrl) {
    throw new Error("DATABASE_URL_TEST must be set (strict env validation enabled)");
  }
  if (!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set (strict env validation enabled)");
  }
}

if (env.S3_BUCKET) {
  if (!env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error("S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY must be set when S3_BUCKET is set");
  }
}

export const config = {
  isProd,
  isDev,
  isTest,
  validateEnvStrict,
  port: env.PORT,
  databaseUrl,
  testDatabaseUrl,
  jwt: {
    accessSecret,
    refreshSecret,
    accessTtlSec: env.JWT_ACCESS_TTL_SEC ?? 15 * 60,
    refreshTtlSec: env.JWT_REFRESH_TTL_SEC ?? 7 * 24 * 60 * 60
  },
  cookies: {
    domain: normalizeCookieDomain(env.COOKIE_DOMAIN),
    secure: isProd,
    sameSite: (env.COOKIE_SAMESITE ?? (isProd ? "none" : "lax")) as "lax" | "strict" | "none"
  },
  cors: {
    origins: env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
      : (isProd ? [] : ["http://localhost:8080", "http://127.0.0.1:8080"])
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS ?? 60_000,
    limit: env.RATE_LIMIT_LIMIT ?? 120
  },
  rank: {
    recomputeLimit: env.RANK_RECOMPUTE_LIMIT ?? 200
  },
  metricsEnabled: env.METRICS_ENABLED !== "false",
  redisUrl: env.REDIS_URL,
  logLevel: env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  storage: {
    s3:
      env.S3_BUCKET
        ? {
            bucket: env.S3_BUCKET,
            region: env.S3_REGION ?? "us-east-1",
            endpoint: env.S3_ENDPOINT,
            forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
            accessKeyId: env.S3_ACCESS_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY
          }
        : undefined
  }
};
