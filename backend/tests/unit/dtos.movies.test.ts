import { describe, it, expect } from "vitest";
import { createMovieBody, updateMovieBody } from "../../src/dtos/movies.js";

describe("dtos/movies", () => {
  it("accepts valid posterUrl http/https and /media paths", () => {
    expect(createMovieBody.safeParse({
      title: "t",
      releaseDate: new Date().toISOString(),
      trailerUrl: "",
      synopsis: "s",
      posterUrl: "https://example.com/a.png"
    }).success).toBe(true);
    expect(createMovieBody.safeParse({
      title: "t",
      releaseDate: new Date().toISOString(),
      synopsis: "s",
      posterUrl: "/media/abc"
    }).success).toBe(true);
  });

  it("rejects invalid posterUrl scheme", () => {
    const r = createMovieBody.safeParse({
      title: "t",
      releaseDate: new Date().toISOString(),
      synopsis: "s",
      posterUrl: "ftp://x"
    });
    expect(r.success).toBe(false);
  });

  it("validates trailerUrl optional empty or url", () => {
    expect(createMovieBody.safeParse({
      title: "t",
      releaseDate: new Date().toISOString(),
      trailerUrl: "",
      synopsis: "s"
    }).success).toBe(true);
    expect(createMovieBody.safeParse({
      title: "t",
      releaseDate: new Date().toISOString(),
      trailerUrl: "https://example.com/trailer.mp4",
      synopsis: "s"
    }).success).toBe(true);
  });

  it("updateMovieBody allows partial fields", () => {
    expect(updateMovieBody.safeParse({ title: "x" }).success).toBe(true);
    expect(updateMovieBody.safeParse({}).success).toBe(true);
  });
});
