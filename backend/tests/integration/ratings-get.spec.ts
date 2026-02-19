import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("User rating fetch", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `rating_get_tester+${runId}@example.com`;
  const password = "pass12345";
  const name = "Rating Getter";
  let movieId: string;

  beforeAll(async () => {
    await prisma.$connect();
    let res = await agent.post("/auth/register").send({ name, email, password });
    if (res.status !== 200 && res.status !== 409) expect(res.status).toBe(200);
    if (res.status === 409) {
      res = await agent.post("/auth/login").send({ email, password });
      expect(res.status).toBe(200);
    }
    const m = await agent.post("/movies").send({
      title: `RGet ${runId}`,
      releaseDate: new Date().toISOString(),
      trailerUrl: "https://example.com",
      synopsis: "s"
    });
    expect(m.status).toBe(200);
    movieId = m.body.data.id;
  });

  afterAll(async () => {
    await prisma.rating.deleteMany({ where: { movieId } });
    await prisma.movie.deleteMany({ where: { id: movieId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("returns null before rating, then value after upsert", async () => {
    const before = await agent.get(`/ratings/${movieId}`);
    expect(before.status).toBe(200);
    expect(before.body?.data?.value).toBe(null);
    const up = await agent.post("/ratings").send({ movieId, value: 4 });
    expect(up.status).toBe(200);
    const after = await agent.get(`/ratings/${movieId}`);
    expect(after.status).toBe(200);
    expect(after.body?.data?.value).toBe(4);
  });
});
