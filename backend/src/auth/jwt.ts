import jwt from "jsonwebtoken";
import { config } from "@config/index.js";

type JwtPayload = { sub: string; role: string };

export function signAccessToken(userId: string, role: string) {
  return jwt.sign({ sub: userId, role } as JwtPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtlSec
  });
}

export function signRefreshToken(userId: string, role: string) {
  return jwt.sign({ sub: userId, role } as JwtPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtlSec
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}
