import { describe, it, expect } from "vitest";
import { queryMoviesPure } from "../../lib/movieQuery";
import type { MovieWithStats, Review } from "../../types/movie";

const movies: MovieWithStats[] = [
  { id: "m1", title: "Alpha", releaseDate: "2020-01-01", posterUrl: "", trailerUrl: "", synopsis: "", createdBy: "u1", createdAt: "2020-01-10", reviewCount: 2, averageRating: 4.5, rank: 1 },
  { id: "m2", title: "Beta", releaseDate: "2021-01-01", posterUrl: "", trailerUrl: "", synopsis: "", createdBy: "u2", createdAt: "2021-01-10", reviewCount: 5, averageRating: 3.0, rank: 2 },
  { id: "m3", title: "Gamma", releaseDate: "2022-01-01", posterUrl: "", trailerUrl: "", synopsis: "", createdBy: "u3", createdAt: "2022-01-10", reviewCount: 1, averageRating: 5.0, rank: 3 },
];

const reviews: Review[] = [
  { id: "r1", movieId: "m1", userId: "u1", rating: 5, content: "", createdAt: "2020-01-10", updatedAt: "2020-01-10" },
  { id: "r2", movieId: "m2", userId: "u1", rating: 3, content: "", createdAt: "2021-01-10", updatedAt: "2021-01-10" },
];

describe("queryMoviesPure", () => {
  it("filters by search", () => {
    const res = queryMoviesPure(movies, reviews, { search: "alp" });
    expect(res.map(m => m.id)).toEqual(["m1"]);
  });
  it("filters by minStars (rounded)", () => {
    const res = queryMoviesPure(movies, reviews, { minStars: 5 });
    expect(res.map(m => m.id)).toEqual(["m1", "m3"]);
  });
  it("scopes to mine", () => {
    const res = queryMoviesPure(movies, reviews, { reviewScope: "mine", userId: "u1" });
    expect(res.map(m => m.id).sort()).toEqual(["m1", "m2"].sort());
  });
  it("scopes to not_mine", () => {
    const res = queryMoviesPure(movies, reviews, { reviewScope: "not_mine", userId: "u1" });
    expect(res.map(m => m.id)).toEqual(["m3"]);
  });
  it("sorts by highest rating", () => {
    const res = queryMoviesPure(movies, reviews, { sortBy: "rating_desc" });
    expect(res.map(m => m.id)).toEqual(["m3", "m1", "m2"]);
  });
  it("sorts by rank", () => {
    const res = queryMoviesPure(movies, reviews, { sortBy: "rank_asc" });
    expect(res.map(m => m.id)).toEqual(["m1", "m2", "m3"]);
  });
  it("sorts by newest release", () => {
    const res = queryMoviesPure(movies, reviews, { sortBy: "release_desc" });
    expect(res[0].id).toBe("m3");
  });
});
