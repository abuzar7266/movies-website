import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Movies suggest", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `suggest_tester+${runId}@example.com`;
  const password = "pass12345";
  const name = "Suggest Tester";
  let movieId: string;
  const title = `The Unusual ${runId}`;

  beforeAll(async () => {
    await prisma.$connect();
    let res = await agent.post("/auth/register").send({ name, email, password });
    if (res.status !== 200 && res.status !== 409) expect(res.status).toBe(200);
    if (res.status === 409) {
      res = await agent.post("/auth/login").send({ email, password });
      expect(res.status).toBe(200);
    }
    const m = await agent.post("/movies").send({
      title,
      releaseDate: new Date().toISOString(),
      trailerUrl: "https://example.com",
      synopsis: "s"
    });
    expect(m.status).toBe(200);
    movieId = m.body.data.id;
  });

  afterAll(async () => {
    await prisma.movie.deleteMany({ where: { id: movieId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("returns up to 5 suggestions matching q", async () => {
    const res = await agent.get(`/movies/suggest`).query({ q: "Unusual" });
    expect(res.status).toBe(200);
    const titles: string[] = res.body.data.map((x: any) => x.title);
    expect(titles.some((t) => t === title)).toBe(true);
  });
});
