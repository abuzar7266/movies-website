import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Movies CRUD and listing", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `movies_tester+${runId}@example.com`;
  const password = "pass12345";
  const name = "Movies Tester";
  const movieTitle = `Movie ${runId}`;

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
  });

  afterAll(async () => {
    await prisma.movie.deleteMany({ where: { title: { contains: runId } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("creates a movie", async () => {
    const res = await agent.post("/movies").send({
      title: movieTitle,
      releaseDate: new Date().toISOString(),
      trailerUrl: "https://example.com/trailer.mp4",
      synopsis: "A test movie"
    });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    movieId = res.body.data.id;
  });

  it("fetches the created movie", async () => {
    const res = await agent.get(`/movies/${movieId}`);
    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe(movieTitle);
  });

  it("lists movies with q filter", async () => {
    const res = await agent.get(`/movies`).query({ q: runId });
    expect(res.status).toBe(200);
    expect(res.body?.data?.items?.some((m: any) => m.id === movieId)).toBe(true);
  });

  it("updates the movie title", async () => {
    const newTitle = `Movie Updated ${runId}`;
    const res = await agent.patch(`/movies/${movieId}`).send({ title: newTitle });
    expect(res.status).toBe(200);
    expect(res.body?.data?.title).toBe(newTitle);
  });

  it("deletes the movie", async () => {
    const res = await agent.delete(`/movies/${movieId}`);
    expect(res.status).toBe(200);
    const notFound = await agent.get(`/movies/${movieId}`);
    expect(notFound.status).toBe(404);
  });
});
