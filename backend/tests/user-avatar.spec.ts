import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/db.js";

describe("User avatar set/unset", () => {
  const agent = request.agent(app);
  const runId = process.env.TEST_RUN_ID || `${Date.now()}`;
  const email = `avatar_tester+${runId}@example.com`;
  const password = "pass12345";
  const name = "Avatar Tester";
  let mediaId: string;

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
    await prisma.media.deleteMany({ where: { id: mediaId } });
    await prisma.user.updateMany({ where: { email }, data: { avatarMediaId: null } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("uploads an image", async () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const res = await agent.post("/media").attach("file", buf, { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    mediaId = res.body.data.id;
  });

  it("sets the avatar to mediaId and reflects in /users/me", async () => {
    const set = await agent.patch("/users/me/avatar").send({ mediaId });
    expect(set.status).toBe(200);
    const me = await agent.get("/users/me");
    expect(me.status).toBe(200);
    expect(me.body?.data?.avatarMediaId).toBe(mediaId);
  });

  it("unsets the avatar", async () => {
    const unset = await agent.patch("/users/me/avatar").send({ mediaId: null });
    expect(unset.status).toBe(200);
    const me = await agent.get("/users/me");
    expect(me.status).toBe(200);
    expect(me.body?.data?.avatarMediaId).toBe(null);
  });
});
