import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { prisma } from "../../src/db.js";
import app from "../../src/app.js";

describe("Movies rank ordering (rank_asc) with on-demand ranks", () => {
  const agent = request.agent(app);
  async function getCsrfToken(): Promise<string> {
    const res = await agent.get("/auth/csrf");
    expect(res.status).toBe(200);
    const sc = res.headers["set-cookie"];
    const arr = Array.isArray(sc) ? sc : typeof sc === "string" ? [sc] : [];
    const row = arr.find((c) => c.startsWith("csrf_token=")) ?? "";
    const m = /csrf_token=([^;]+)/.exec(row);
    if (!m) throw new Error("csrf_token cookie not found");
    return decodeURIComponent(m[1]);
  }
  const runId = crypto.randomUUID();
  const email = `ranker+${runId}@example.com`;
  const password = "pass12345";
  const name = "Rank Tester";
  const nowIso = new Date().toISOString();
  const titles = [`M-A-${runId}`, `M-B-${runId}`, `M-C-${runId}`];
  const ids: string[] = [];
  let csrf: string;

  beforeAll(async () => {
    await prisma.$connect();
    let res = await agent.post("/auth/register").send({ name, email, password });
    if (res.status === 409) {
      res = await agent.post("/auth/login").send({ email, password });
      expect(res.status).toBe(200);
    } else {
      expect(res.status).toBe(200);
    }
    // CSRF token
    csrf = await getCsrfToken();
    // Create three movies (all rank = 0 initially)
    for (const t of titles) {
      const m = await agent.post("/movies").set("X-CSRF-Token", csrf).send({
        title: t,
        releaseDate: nowIso,
        synopsis: "Test",
        trailerUrl: ""
      });
      expect(m.status).toBe(200);
      ids.push(m.body.data.id);
    }
    // Add different number of reviews to influence ranking (more reviews => better rank)
    // ids[1] -> 2 reviews
    await agent.post("/reviews").set("X-CSRF-Token", csrf).send({ movieId: ids[1], content: "Good" });
    await agent.post("/reviews").set("X-CSRF-Token", csrf).send({ movieId: ids[1], content: "Great" });
    // ids[2] -> 1 review
    await agent.post("/reviews").set("X-CSRF-Token", csrf).send({ movieId: ids[2], content: "Ok" });
    // ids[0] -> 0 reviews
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { movieId: { in: ids } } });
    await prisma.rating.deleteMany({ where: { movieId: { in: ids } } });
    await prisma.movie.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("returns list sorted by computed rank (best first) even if stored rank=0", async () => {
    const res = await agent.get("/movies").query({ sort: "rank_asc", page: 1, pageSize: 10 });
    expect(res.status).toBe(200);
    const items: Array<{ id: string; rank: number }> = res.body?.data?.items ?? [];
    // Expect ids[1] (2 reviews) first, then ids[2] (1 review), then ids[0] (0 reviews)
    const order = items.filter((m) => ids.includes(m.id)).map((m) => m.id);
    expect(order[0]).toBe(ids[1]);
    expect(order[1]).toBe(ids[2]);
    expect(order[2]).toBe(ids[0]);
    // Ranks should be positive after on-demand computation
    const ranks = items.filter((m) => ids.includes(m.id)).map((m) => m.rank);
    expect(ranks.every((r) => r > 0)).toBe(true);
  });
});
