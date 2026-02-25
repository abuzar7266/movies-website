import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Auth error cases", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `auth_err_${runId}@example.com`;
  const password = "pass12345";
  const name = "Auth Err";

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("returns 409 on duplicate registration", async () => {
    let r1 = await agent.post("/auth/register").send({ name, email, password });
    expect([200, 409]).toContain(r1.status);
    let r2 = await agent.post("/auth/register").send({ name, email, password });
    expect(r2.status).toBe(409);
  });

  it("returns 401 on invalid login", async () => {
    const r = await agent.post("/auth/login").send({ email, password: "pass12346" });
    expect(r.status).toBe(401);
  });

  it("returns 401 on refresh without cookie", async () => {
    const freshAgent = request.agent(app);
    const r = await freshAgent.post("/auth/refresh");
    expect(r.status).toBe(401);
  });
});
