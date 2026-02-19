import { useState, useEffect, useRef, useCallback } from "react";
import type { MovieWithStats } from "../../types/movie";
import { MovieCard } from "./MovieCard";
import { Loader2 } from "lucide-react";
import styles from "./MovieGrid.module.css";

const PAGE_SIZE = 12;

interface MovieGridProps {
  movies: MovieWithStats[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
  loaded?: boolean;
  error?: boolean;
}

export function MovieGrid({ movies, hasMore: hasMoreProp, onLoadMore, loading, loaded, error }: MovieGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);

  const hasMoreLocal = visibleCount < movies.length;
  const isRemote = typeof onLoadMore === "function";
  const hasMore = isRemote ? Boolean(hasMoreProp) : hasMoreLocal;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (!entry.isIntersecting || !hasMore) return;
      if (isRemote) {
        onLoadMore?.();
      } else {
        setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, movies.length));
        }, 300);
      }
    },
    [hasMore, movies.length, isRemote, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "200px",
      threshold: 0,
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (movies.length === 0 && Boolean(loading)) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div key={i} className={styles.pulse}>
            <div className={styles.skeletonCard}>
              <div className={styles.skeletonPoster} />
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonLineLg} />
                <div className={styles.skeletonLineSm} />
                <div className={styles.skeletonRow}>
                  <div className={styles.skeletonPillWide} />
                  <div className={styles.skeletonPillNarrow} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (movies.length === 0 && !loading && (loaded ?? true)) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>
          {error ? "Failed to load movies" : "No movies found"}
        </p>
        <p className={styles.emptySubtitle}>
          {error ? "Please try again." : "Try a different search or add a new movie."}
        </p>
      </div>
    );
  }

  const visible = isRemote ? movies : movies.slice(0, visibleCount);

  return (
    <>
      <div className={styles.grid}>
        {visible.map((movie, i) => (
          <div
            key={movie.id}
            className={styles.fadeIn}
            style={{ animationDelay: `${Math.min(i + 1, 6) * 0.05}s` }}
          >
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
      {hasMore && (
        <div ref={loaderRef} className={styles.loaderRow}>
          <Loader2 size={24} className={styles.spinner} />
          <span className={styles.loaderText}>Loading more movies...</span>
        </div>
      )}
      {!hasMore && !loading && movies.length > PAGE_SIZE && (
        <p className={styles.endText}>You&apos;ve seen all {movies.length} movies</p>
      )}
    </>
  );
}
