import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Movies recompute ranks windowed", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `recompute+${runId}@example.com`;
  const password = "pass12345";
  const name = "Reco";
  const titles = [`R-A-${runId}`, `R-B-${runId}`, `R-C-${runId}`];
  const ids: string[] = [];

  async function createMovie(title: string) {
    const res = await agent.post("/movies").send({
      title,
      releaseDate: new Date().toISOString(),
      trailerUrl: "",
      synopsis: "s"
    });
    expect(res.status).toBe(200);
    ids.push(res.body.data.id);
    return res.body.data.id as string;
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
    await createMovie(titles[0]);
    await createMovie(titles[1]);
    await createMovie(titles[2]);
    // add reviews: B gets 2, C gets 1, A gets 0
    await agent.post("/reviews").send({ movieId: ids[1], content: "one" });
    await agent.post("/reviews").send({ movieId: ids[1], content: "two" });
    await agent.post("/reviews").send({ movieId: ids[2], content: "ok" });
    // set a wrong rank within window to A to ensure it clears when outside top-2
    await prisma.movie.update({ where: { id: ids[0] }, data: { rank: 2 } });
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { movieId: { in: ids } } });
    await prisma.rating.deleteMany({ where: { movieId: { in: ids } } });
    await prisma.movie.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("recomputes ranks for top N and clears others", async () => {
    vi.resetModules();
    process.env.RANK_RECOMPUTE_LIMIT = "2";
    const { recomputeMovieRanks } = await import("../../src/services/movies.js");
    await recomputeMovieRanks(prisma);
    const rows = await prisma.movie.findMany({
      where: { id: { in: ids } },
      select: { id: true, rank: true },
      orderBy: { id: "asc" }
    });
    const byId = new Map(rows.map((r: any) => [r.id, r.rank]));
    expect(byId.get(ids[0])).toBe(0); // outside top-2 -> cleared from 2 to 0
  });
});
