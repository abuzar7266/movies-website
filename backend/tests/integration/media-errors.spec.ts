import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Media error cases", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `media_err_${runId}@example.com`;
  const password = "pass12345";
  const name = "Media Err";

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
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.media.deleteMany({ where: { ownerUserId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it("rejects when no file provided", async () => {
    const r = await agent.post("/media");
    expect(r.status).toBe(400);
  });

  it("rejects unsupported mime type", async () => {
    const r = await agent
      .post("/media")
      .attach("file", Buffer.from("hello"), { filename: "a.txt", contentType: "text/plain" });
    expect(r.status).toBe(400);
  });
});
