import "dotenv/config";
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Rate limiter (test route)", () => {
  it("returns 429 after hitting limit", async () => {
    const a = await request(app).get("/test/rl");
    const b = await request(app).get("/test/rl");
    const c = await request(app).get("/test/rl");
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(c.status).toBe(200);
    const d = await request(app).get("/test/rl");
    expect(d.status).toBe(429);
  });
});
