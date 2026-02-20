import { useState, useEffect, useRef, useCallback } from "react";
import type { MovieWithStats } from "@src/types/movie";
import { MovieCard } from "./MovieCard";
import { Loader2 } from "lucide-react";
import styles from "./MovieGrid.module.css";

const MAX_PAGE_SIZE = 12;

function columnsForWidth(width: number): number {
  if (width >= 1280) return 6;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
}

function pageSizeForWidth(width: number): number {
  return Math.min(MAX_PAGE_SIZE, columnsForWidth(width) * 2);
}

interface MovieGridProps {
  movies: MovieWithStats[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
  loaded?: boolean;
  error?: boolean;
}

export function MovieGrid({ movies, hasMore: hasMoreProp, onLoadMore, loading, loaded, error }: MovieGridProps) {
  const [pageSize, setPageSize] = useState(() => (typeof window === "undefined" ? MAX_PAGE_SIZE : pageSizeForWidth(window.innerWidth)));
  const [visibleCount, setVisibleCount] = useState(() => (typeof window === "undefined" ? MAX_PAGE_SIZE : pageSizeForWidth(window.innerWidth)));
  const loaderRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const wasIntersectingRef = useRef(false);

  useEffect(() => {
    const onResize = () => {
      const next = pageSizeForWidth(window.innerWidth);
      setPageSize((prev) => (prev === next ? prev : next));
      setVisibleCount((prev) => Math.max(prev, next));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const hasMoreLocal = visibleCount < movies.length;
  const isRemote = typeof onLoadMore === "function";
  const hasMore = isRemote ? Boolean(hasMoreProp) : hasMoreLocal;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (!entry) return;
      if (!entry.isIntersecting) {
        wasIntersectingRef.current = false;
        return;
      }
      if (!hasMore) return;
      if (wasIntersectingRef.current) return;
      wasIntersectingRef.current = true;

      if (inFlightRef.current) return;
      if (isRemote && Boolean(loading)) return;
      inFlightRef.current = true;

      if (isRemote) {
        onLoadMore?.();
      } else {
        setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + pageSize, movies.length));
          inFlightRef.current = false;
        }, 300);
      }
    },
    [hasMore, isRemote, loading, movies.length, onLoadMore, pageSize]
  );

  useEffect(() => {
    if (!isRemote) return;
    if (!loading) inFlightRef.current = false;
  }, [isRemote, loading, movies.length, hasMore]);

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
        {Array.from({ length: pageSize }).map((_, i) => (
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
      {!hasMore && !loading && movies.length > pageSize && (
        <p className={styles.endText}>You&apos;ve seen all {movies.length} movies</p>
      )}
    </>
  );
}
