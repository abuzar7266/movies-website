import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/db.js";

describe("Media upload and ETag", () => {
  const agent = request.agent(app);
  const runId = process.env.TEST_RUN_ID || `${Date.now()}`;
  const email = `media_tester+${runId}@example.com`;
  const password = "pass12345";
  const name = "Media Tester";
  const title = `Media Movie ${runId}`;
  let mediaId: string;
  let movieId: string;

  beforeAll(async () => {
    await prisma.$connect();
    let res = await agent.post("/auth/register").send({ name, email, password });
    if (res.status === 409) {
      res = await agent.post("/auth/login").send({ email, password });
      expect(res.status).toBe(200);
    } else {
      expect(res.status).toBe(200);
    }
    const m = await agent.post("/movies").send({
      title,
      releaseDate: new Date().toISOString(),
      trailerUrl: "https://example.com/t.mp4",
      synopsis: "Test"
    });
    expect(m.status).toBe(200);
    movieId = m.body.data.id;
  });

  afterAll(async () => {
    await prisma.media.deleteMany({ where: { id: mediaId } });
    await prisma.movie.deleteMany({ where: { id: movieId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("uploads a small image and returns metadata", async () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // fake png header
    const res = await agent
      .post("/media")
      .attach("file", buf, { filename: "t.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    mediaId = res.body.data.id;
  });

  it("sets movie poster to uploaded media", async () => {
    const res = await agent.patch(`/movies/${movieId}/poster`).send({ mediaId });
    expect(res.status).toBe(200);
    expect(res.body?.data?.posterMediaId).toBe(mediaId);
  });

  it("serves media with ETag and supports 304", async () => {
    const first = await agent.get(`/media/${mediaId}`);
    expect(first.status).toBe(200);
    const etag = first.headers.etag;
    const second = await agent.get(`/media/${mediaId}`).set("If-None-Match", etag);
    expect(second.status).toBe(304);
  });
});
