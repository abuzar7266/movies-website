import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/db.js";
import { validate } from "@middleware/validate.js";
import argon2 from "argon2";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@auth/jwt.js";
import { config } from "@config/index.js";
import { HttpError } from "@middleware/errors.js";

const router = Router();

import { registerBody, loginBody } from "@dtos/auth.js";

router.post("/register", validate({ body: registerBody }), async (req, res, next) => {
  try {
    const { name, email, password } = req.body as z.infer<typeof registerBody>;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "Email already registered", "email_taken");
    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    const access = signAccessToken(user.id, user.role);
    const refresh = signRefreshToken(user.id, user.role);
    setCookies(res, access, refresh);
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
});

router.post("/login", validate({ body: loginBody }), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginBody>;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(401, "Invalid credentials", "invalid_credentials");
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new HttpError(401, "Invalid credentials", "invalid_credentials");
    const access = signAccessToken(user.id, user.role);
    const refresh = signRefreshToken(user.id, user.role);
    setCookies(res, access, refresh);
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) throw new HttpError(401, "Unauthorized", "unauthorized");
    const { sub, role } = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user) throw new HttpError(401, "Unauthorized", "unauthorized");
    const access = signAccessToken(user.id, role);
    const refresh = signRefreshToken(user.id, role);
    setCookies(res, access, refresh);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("access_token", cookieOpts());
  res.clearCookie("refresh_token", cookieOpts());
  res.json({ success: true });
});

function cookieOpts() {
  return {
    httpOnly: true,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    domain: config.cookies.domain,
    path: "/"
  } as const;
}
function setCookies(res: any, access: string, refresh: string) {
  res.cookie("access_token", access, { ...cookieOpts(), maxAge: config.jwt.accessTtlSec * 1000 });
  res.cookie("refresh_token", refresh, { ...cookieOpts(), maxAge: config.jwt.refreshTtlSec * 1000 });
}

export default router;
