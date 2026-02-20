import type { MovieWithStats, Review } from "@src/types/movie";

export type ReviewScope = "all" | "mine" | "not_mine";
export type SortKey = "rank_asc" | "reviews_desc" | "rating_desc" | "release_desc" | "release_asc" | "uploaded_desc";

export function queryMoviesPure(
  ranked: MovieWithStats[],
  reviews: Review[],
  opts: {
    search?: string;
    minStars?: number;
    reviewScope?: ReviewScope;
    sortBy?: SortKey;
    userId?: string;
  }
): MovieWithStats[] {
  const q = (opts.search || "").trim().toLowerCase();
  const min = opts.minStars ?? 0;
  let base = q ? ranked.filter(m => m.title.toLowerCase().includes(q)) : ranked;
  if (min > 0) base = base.filter(m => Math.round(m.averageRating) >= min);
  if (opts.reviewScope && opts.reviewScope !== "all" && opts.userId) {
    const mine = new Set(reviews.filter(r => r.userId === opts.userId).map(r => r.movieId));
    base = opts.reviewScope === "mine" ? base.filter(m => mine.has(m.id)) : base.filter(m => !mine.has(m.id));
  }
  const sorted = [...base];
  switch (opts.sortBy) {
    case "rank_asc":
      sorted.sort((a, b) => a.rank - b.rank);
      break;
    case "rating_desc":
      sorted.sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount);
      break;
    case "release_desc":
      sorted.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      break;
    case "release_asc":
      sorted.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
      break;
    case "uploaded_desc":
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "reviews_desc":
    default:
      sorted.sort((a, b) => b.reviewCount - a.reviewCount || b.averageRating - a.averageRating);
  }
  return sorted;
}
