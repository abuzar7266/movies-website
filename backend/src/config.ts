import "dotenv/config";

const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 4000);

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

export const config = {
  isProd,
  port,
  jwt: {
    accessSecret: jwtAccessSecret,
    refreshSecret: jwtRefreshSecret,
    accessTtlSec: Number(process.env.JWT_ACCESS_TTL_SEC || 15 * 60),
    refreshTtlSec: Number(process.env.JWT_REFRESH_TTL_SEC || 7 * 24 * 60 * 60)
  },
  cookies: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: isProd,
    sameSite: ("lax" as const)
  }
};

if (isProd && (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  console.warn("JWT secrets are not set in production environment");
}
