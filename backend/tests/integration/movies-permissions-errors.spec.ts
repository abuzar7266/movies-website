import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Movies permissions and poster error paths", () => {
  const agentA = request.agent(app);
  const agentB = request.agent(app);
  const runId = crypto.randomUUID();
  const emailA = `owner_${runId}@example.com`;
  const emailB = `other_${runId}@example.com`;
  const password = "pass12345";
  const nameA = "Owner";
  const nameB = "Other";
  let movieId: string;
  let mediaB: string;

  async function getCsrf(agent: any): Promise<string> {
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
    // Register/log in both users
    let rA = await agentA.post("/auth/register").send({ name: nameA, email: emailA, password });
    if (rA.status === 409) {
      rA = await agentA.post("/auth/login").send({ email: emailA, password });
      expect(rA.status).toBe(200);
    } else {
      expect(rA.status).toBe(200);
    }
    let rB = await agentB.post("/auth/register").send({ name: nameB, email: emailB, password });
    if (rB.status === 409) {
      rB = await agentB.post("/auth/login").send({ email: emailB, password });
      expect(rB.status).toBe(200);
    } else {
      expect(rB.status).toBe(200);
    }
    // A creates a movie
    const created = await agentA.post("/movies").send({
      title: `Perm Movie ${runId}`,
      releaseDate: new Date().toISOString(),
      trailerUrl: "",
      synopsis: "s"
    });
    expect(created.status).toBe(200);
    movieId = created.body.data.id;
    // B uploads media
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAukB9p0QymsAAAAASUVORK5CYII=",
      "base64"
    );
    const up = await agentB
      .post("/media")
      .set("X-CSRF-Token", await getCsrf(agentB))
      .attach("file", png1x1, { filename: "p.png", contentType: "image/png" });
    expect(up.status).toBe(200);
    mediaB = up.body.data.id;
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { movieId } });
    await prisma.rating.deleteMany({ where: { movieId } });
    await prisma.media.deleteMany({ where: { id: mediaB } }).catch(() => {});
    await prisma.movie.deleteMany({ where: { id: movieId } });
    await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
    await prisma.$disconnect();
  });

  it("rejects update by non-owner with 403", async () => {
    const res = await agentB
      .patch(`/movies/${movieId}`)
      .set("X-CSRF-Token", await getCsrf(agentB))
      .send({ title: "nope" });
    expect(res.status).toBe(403);
  });

  it("rejects delete by non-owner with 403", async () => {
    const res = await agentB
      .delete(`/movies/${movieId}`)
      .set("X-CSRF-Token", await getCsrf(agentB));
    expect(res.status).toBe(403);
  });

  it("rejects setting poster with nonexistent media", async () => {
    const bogus = crypto.randomUUID();
    const res = await agentA
      .patch(`/movies/${movieId}/poster`)
      .set("X-CSRF-Token", await getCsrf(agentA))
      .send({ mediaId: bogus });
    expect(res.status).toBe(404);
  });

  it("rejects setting poster with other user's media", async () => {
    const res = await agentA
      .patch(`/movies/${movieId}/poster`)
      .set("X-CSRF-Token", await getCsrf(agentA))
      .send({ mediaId: mediaB });
    expect(res.status).toBe(403);
  });
});
