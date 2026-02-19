import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Ratings upsert and average recompute", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `ratings_tester+${runId}@example.com`;
  const password = "pass12345";
  const name = "Ratings Tester";
  const title = `Rating Movie ${runId}`;
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
    await prisma.rating.deleteMany({ where: { movieId } });
    await prisma.movie.deleteMany({ where: { id: movieId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("sets rating to 4 and updates average", async () => {
    const res = await agent.post("/ratings").send({ movieId, value: 4 });
    expect(res.status).toBe(200);
    expect(Math.round((res.body?.data?.averageRating || 0) * 10) / 10).toBe(4);
  });

  it("updates rating to 2 and updates average", async () => {
    const res = await agent.post("/ratings").send({ movieId, value: 2 });
    expect(res.status).toBe(200);
    expect(Math.round((res.body?.data?.averageRating || 0) * 10) / 10).toBe(2);
  });
});
