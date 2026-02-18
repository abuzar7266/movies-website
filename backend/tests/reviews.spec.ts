import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/db.js";

describe("Reviews CRUD with reviewCount", () => {
  const agent = request.agent(app);
  const runId = process.env.TEST_RUN_ID || `${Date.now()}`;
  const email = `reviews_tester+${runId}@example.com`;
  const password = "pass12345";
  const name = "Reviews Tester";
  const title = `Review Movie ${runId}`;
  let movieId: string;
  let reviewId: string;

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
    await prisma.review.deleteMany({ where: { movieId } });
    await prisma.movie.deleteMany({ where: { id: movieId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("creates a review and increments reviewCount", async () => {
    const before = await prisma.movie.findUnique({ where: { id: movieId } });
    const res = await agent.post("/reviews").send({ movieId, content: "Great" });
    expect(res.status).toBe(200);
    reviewId = res.body.data.id;
    const after = await prisma.movie.findUnique({ where: { id: movieId } });
    expect((after?.reviewCount || 0) - (before?.reviewCount || 0)).toBe(1);
  });

  it("lists reviews by movie", async () => {
    const res = await agent.get("/reviews").query({ movieId });
    expect(res.status).toBe(200);
    expect(res.body?.data?.items?.some((r: any) => r.id === reviewId)).toBe(true);
  });

  it("updates a review", async () => {
    const res = await agent.patch(`/reviews/${reviewId}`).send({ content: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body?.data?.content).toBe("Updated");
  });

  it("deletes a review and decrements reviewCount", async () => {
    const before = await prisma.movie.findUnique({ where: { id: movieId } });
    const del = await agent.delete(`/reviews/${reviewId}`);
    expect(del.status).toBe(200);
    const after = await prisma.movie.findUnique({ where: { id: movieId } });
    expect((before?.reviewCount || 0) - (after?.reviewCount || 0)).toBe(1);
  });
});
