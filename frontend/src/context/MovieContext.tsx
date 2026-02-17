import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import type { Movie, Review, MovieWithStats } from "../types/movie";
import { sampleMovies, sampleReviews } from "../data/sample-data";

interface MovieContextType {
  movies: Movie[];
  reviews: Review[];
  rankedMovies: MovieWithStats[];
  getMovieById: (id: string) => Movie | undefined;
  getReviewsForMovie: (movieId: string) => Review[];
  getMovieStats: (movieId: string) => { reviewCount: number; averageRating: number; rank: number };
  addMovie: (movie: Omit<Movie, "id" | "createdAt">) => boolean;
  updateMovie: (id: string, updates: Partial<Movie>) => void;
  deleteMovie: (id: string) => void;
  addReview: (review: Omit<Review, "id" | "createdAt" | "updatedAt">) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  searchMovies: (query: string) => MovieWithStats[];
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const MovieProvider = ({ children }: { children: ReactNode }) => {
  const STORAGE_KEY = "movieshelf:v1";
  const initial = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { movies: Movie[]; reviews: Review[] };
        return { movies: parsed.movies, reviews: parsed.reviews };
      }
    } catch {}
    return { movies: sampleMovies, reviews: sampleReviews };
  })();

  const [movies, setMovies] = useState<Movie[]>(initial.movies);
  const [reviews, setReviews] = useState<Review[]>(initial.reviews);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ movies, reviews }));
    } catch {}
  }, [movies, reviews]);

  // in-memory caches (invalidated on data changes)
  const movieByIdCache = useRef(new Map<string, Movie | undefined>());
  const reviewsByMovieCache = useRef(new Map<string, Review[]>());
  const statsCache = useRef(new Map<string, { reviewCount: number; averageRating: number; rank: number }>());
  const searchCache = useRef(new Map<string, MovieWithStats[]>());

  const rankedMovies = useMemo((): MovieWithStats[] => {
    movieByIdCache.current.clear();
    reviewsByMovieCache.current.clear();
    statsCache.current.clear();
    searchCache.current.clear();
    const stats = movies.map((movie) => {
      const movieReviews = reviews.filter((r) => r.movieId === movie.id);
      const reviewCount = movieReviews.length;
      const averageRating = reviewCount > 0
        ? movieReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;
      return { ...movie, reviewCount, averageRating, rank: 0 };
    });
    stats.sort((a, b) => b.reviewCount - a.reviewCount || b.averageRating - a.averageRating);
    let currentRank = 1;
    stats.forEach((m, i) => {
      if (i > 0 && m.reviewCount < stats[i - 1].reviewCount) {
        currentRank = i + 1;
      }
      m.rank = currentRank;
    });
    return stats;
  }, [movies, reviews]);

  const getMovieById = useCallback((id: string) => {
    if (movieByIdCache.current.has(id)) return movieByIdCache.current.get(id);
    const found = movies.find((m) => m.id === id);
    movieByIdCache.current.set(id, found);
    return found;
  }, [movies]);

  const getReviewsForMovie = useCallback((movieId: string) => {
    const cached = reviewsByMovieCache.current.get(movieId);
    if (cached) return cached;
    const rows = reviews.filter((r) => r.movieId === movieId);
    reviewsByMovieCache.current.set(movieId, rows);
    return rows;
  }, [reviews]);

  const getMovieStats = useCallback((movieId: string) => {
    const maybe = statsCache.current.get(movieId);
    if (maybe) return maybe;
    const found = rankedMovies.find((m) => m.id === movieId);
    const value = found
      ? { reviewCount: found.reviewCount, averageRating: found.averageRating, rank: found.rank }
      : { reviewCount: 0, averageRating: 0, rank: 0 };
    statsCache.current.set(movieId, value);
    return value;
  }, [rankedMovies]);

  const addMovie = useCallback((movie: Omit<Movie, "id" | "createdAt">): boolean => {
    if (movies.some((m) => m.title.toLowerCase() === movie.title.toLowerCase())) {
      return false;
    }
    const newMovie: Movie = {
      ...movie,
      id: `movie-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMovies((prev) => [...prev, newMovie]);
    return true;
  }, [movies]);

  const updateMovie = useCallback((id: string, updates: Partial<Movie>) => {
    setMovies((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const deleteMovie = useCallback((id: string) => {
    setMovies((prev) => prev.filter((m) => m.id !== id));
    setReviews((prev) => prev.filter((r) => r.movieId !== id));
  }, []);

  const addReview = useCallback((review: Omit<Review, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newReview: Review = { ...review, id: `rev-${Date.now()}`, createdAt: now, updatedAt: now };
    setReviews((prev) => [...prev, newReview]);
  }, []);

  const updateReview = useCallback((id: string, updates: Partial<Review>) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
    );
  }, []);

  const deleteReview = useCallback((id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const searchMovies = useCallback((query: string): MovieWithStats[] => {
    const key = query.trim().toLowerCase();
    if (!key) return rankedMovies;
    const hit = searchCache.current.get(key);
    if (hit) return hit;
    const res = rankedMovies.filter((m) => m.title.toLowerCase().includes(key));
    searchCache.current.set(key, res);
    return res;
  }, [rankedMovies]);

  return (
    <MovieContext.Provider
      value={{
        movies, reviews, rankedMovies,
        getMovieById, getReviewsForMovie, getMovieStats,
        addMovie, updateMovie, deleteMovie,
        addReview, updateReview, deleteReview,
        searchMovies,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = (): MovieContextType => {
  const context = useContext(MovieContext);
  if (!context) throw new Error("useMovies must be used within MovieProvider");
  return context;
};
