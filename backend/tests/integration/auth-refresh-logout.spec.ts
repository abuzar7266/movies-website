import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Auth refresh and logout", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `auth_refresh_${runId}@example.com`;
  const password = "pass12345";
  const name = "Auth Refresh";

  beforeAll(async () => {
    await prisma.$connect();
    let res = await agent.post("/auth/register").send({ name, email, password });
    if (res.status === 409) {
      res = await agent.post("/auth/login").send({ email, password });
      expect(res.status).toBe(200);
    } else {
      expect(res.status).toBe(200);
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("refresh issues new tokens", async () => {
    const r = await agent.post("/auth/refresh");
    expect(r.status).toBe(200);
    const sc = r.headers["set-cookie"] || [];
    const cookies = (Array.isArray(sc) ? sc : [sc]).join("; ");
    expect(cookies.includes("access_token=")).toBe(true);
    expect(cookies.includes("refresh_token=")).toBe(true);
  });

  it("logout clears cookies and subsequent calls are unauthorized", async () => {
    const out = await agent.post("/auth/logout");
    expect(out.status).toBe(200);
    const r = await agent.post("/auth/refresh");
    expect(r.status).toBe(401);
  });
});
