import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Auth flows", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `user+${runId}@example.com`;
  const password = "pass12345";
  const name = "Test User";

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.rating.deleteMany({ where: { user: { email: email } } });
    await prisma.review.deleteMany({ where: { user: { email: email } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("registers or logs in and returns user", async () => {
    let res = await agent.post("/auth/register").send({ name, email, password });
    if (res.status === 409) {
      res = await agent.post("/auth/login").send({ email, password });
    }
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.email).toBe(email);
  });

  it("returns current user from /users/me with cookie", async () => {
    const res = await agent.get("/users/me");
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.email).toBe(email);
  });

  it("logs out and then /users/me is unauthorized without cookie", async () => {
    const logout = await agent.post("/auth/logout");
    expect(logout.status).toBe(200);
    const res = await request(app).get("/users/me");
    expect(res.status).toBe(401);
  });
});
