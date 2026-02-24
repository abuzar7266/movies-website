import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Media upload, set poster, and delete clears references", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `media_tester+${runId}@example.com`;
  const password = "pass12345";
  const name = "Media Tester";
  const title = `Media Movie ${runId}`;
  let movieId: string;
  let mediaId: string;

  async function getCsrfToken(): Promise<string> {
    const res = await agent.get("/auth/csrf");
    expect(res.status).toBe(200);
    const sc = res.headers["set-cookie"];
    const arr = Array.isArray(sc) ? sc : typeof sc === "string" ? [sc] : [];
    const row = arr.find((c) => c.startsWith("csrf_token=")) ?? "";
    const match = /csrf_token=([^;]+)/.exec(row);
    if (!match) throw new Error("csrf_token cookie not found");
    return decodeURIComponent(match[1]);
  }

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
    await prisma.movie.deleteMany({ where: { id: movieId } });
    await prisma.media.deleteMany({ where: { id: mediaId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("uploads media, sets poster, then deletes media and clears poster", async () => {
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAukB9p0QymsAAAAASUVORK5CYII=",
      "base64"
    );
    const csrf = await getCsrfToken();
    const up = await agent
      .post("/media")
      .set("X-CSRF-Token", csrf)
      .attach("file", png1x1, { filename: "p.png", contentType: "image/png" });
    expect(up.status).toBe(200);
    expect(up.body?.success).toBe(true);
    mediaId = up.body.data.id;
    expect(typeof mediaId).toBe("string");
    expect(up.body.data.url).toBe(`/media/${mediaId}`);

    const setPoster = await agent
      .patch(`/movies/${movieId}/poster`)
      .set("X-CSRF-Token", await getCsrfToken())
      .send({ mediaId });
    expect(setPoster.status).toBe(200);
    expect(setPoster.body?.success).toBe(true);
    expect(setPoster.body?.data?.posterMediaId).toBe(mediaId);
    expect(setPoster.body?.data?.posterUrl).toBe(`/media/${mediaId}`);

    const got = await agent.get(`/movies/${movieId}`);
    expect(got.status).toBe(200);
    expect(got.body?.data?.posterMediaId).toBe(mediaId);
    expect(got.body?.data?.posterUrl).toBe(`/media/${mediaId}`);

    const del = await agent.delete(`/media/${mediaId}`).set("X-CSRF-Token", await getCsrfToken());
    expect(del.status).toBe(200);
    expect(del.body?.success).toBe(true);

    const notFound = await agent.get(`/media/${mediaId}`);
    expect(notFound.status).toBe(404);

    const after = await agent.get(`/movies/${movieId}`);
    expect(after.status).toBe(200);
    expect(after.body?.data?.posterMediaId).toBeNull();
    expect(after.body?.data?.posterUrl).toBeNull();
  });
});
