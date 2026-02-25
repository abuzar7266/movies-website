import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/db.js";

describe("Movies listing filters and sorting", () => {
  const agent = request.agent(app);
  const runId = crypto.randomUUID();
  const email = `movies_filters+${runId}@example.com`;
  const password = "pass12345";
  const name = "Movies Filters";
  const titles = [`F-A-${runId}`, `F-B-${runId}`, `F-C-${runId}`];
  const ids: string[] = [];

  async function createMovie(title: string, releaseDate: string) {
    const res = await agent.post("/movies").send({
      title,
      releaseDate,
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
    // Create movies with different release dates
    const older = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const newer = new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString();
    const newest = new Date().toISOString();
    await createMovie(titles[0], older);
    await createMovie(titles[1], newer);
    await createMovie(titles[2], newest);
    // Add one review to A so reviewScope=mine picks it
    await agent.post("/reviews").send({ movieId: ids[0], content: "Nice" });
    // Add rating to B for minStars filter
    await agent.post("/ratings").send({ movieId: ids[1], value: 5 });
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { movieId: { in: ids } } });
    await prisma.rating.deleteMany({ where: { movieId: { in: ids } } });
    await prisma.movie.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("filters by q", async () => {
    const res = await agent.get("/movies").query({ q: runId });
    expect(res.status).toBe(200);
    const got = res.body?.data?.items ?? [];
    expect(got.filter((m: any) => titles.includes(m.title)).length).toBe(3);
  });

  it("filters by reviewScope=mine", async () => {
    const res = await agent.get("/movies").query({ q: runId, reviewScope: "mine" });
    expect(res.status).toBe(200);
    const got = res.body?.data?.items ?? [];
    expect(got.some((m: any) => m.title === titles[0])).toBe(true);
    expect(got.some((m: any) => m.title === titles[1])).toBe(false);
  });

  it("filters by reviewScope=not_mine", async () => {
    const res = await agent.get("/movies").query({ q: runId, reviewScope: "not_mine" });
    expect(res.status).toBe(200);
    const got = res.body?.data?.items ?? [];
    expect(got.some((m: any) => m.title === titles[0])).toBe(false);
    expect(got.some((m: any) => m.title === titles[1])).toBe(true);
  });

  it("filters by minStars", async () => {
    const res = await agent.get("/movies").query({ q: runId, minStars: 4 });
    expect(res.status).toBe(200);
    const got = res.body?.data?.items ?? [];
    expect(got.some((m: any) => m.title === titles[1])).toBe(true);
  });

  it("sorts by release_asc and release_desc", async () => {
    const asc = await agent.get("/movies").query({ q: runId, sort: "release_asc" });
    expect(asc.status).toBe(200);
    const ascTitles = asc.body?.data?.items?.map((m: any) => m.title) ?? [];
    const ascIdx = ascTitles.filter((t: string) => titles.includes(t));
    expect(ascIdx.indexOf(titles[0]) < ascIdx.indexOf(titles[1])).toBe(true);

    const desc = await agent.get("/movies").query({ q: runId, sort: "release_desc" });
    expect(desc.status).toBe(200);
    const descTitles = desc.body?.data?.items?.map((m: any) => m.title) ?? [];
    const descIdx = descTitles.filter((t: string) => titles.includes(t));
    expect(descIdx.indexOf(titles[0]) > descIdx.indexOf(titles[1])).toBe(true);
  });
});
