import { useState, useEffect, useRef, useCallback } from "react";
import type { MovieWithStats } from "../../types/movie";
import { MovieCard } from "./MovieCard";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 12;

interface MovieGridProps {
  movies: MovieWithStats[];
}

export function MovieGrid({ movies }: MovieGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);

  const hasMore = visibleCount < movies.length;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore) {
        setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, movies.length));
        }, 300);
      }
    },
    [hasMore, movies.length]
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

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-display text-[hsl(var(--muted-foreground))]">No movies found</p>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Try a different search or add a new movie.</p>
      </div>
    );
  }

  const visible = movies.slice(0, visibleCount);

  return (
    <>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visible.map((movie, i) => (
          <div key={movie.id} className={`animate-fade-in opacity-0 stagger-${Math.min(i + 1, 6)}`}>
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
      {hasMore && (
        <div ref={loaderRef} className="flex items-center justify-center py-10">
          <Loader2 size={24} className="animate-spin text-[hsl(var(--primary))]" />
          <span className="ml-2 text-sm text-[hsl(var(--muted-foreground))]">Loading more movies...</span>
        </div>
      )}
      {!hasMore && movies.length > PAGE_SIZE && (
        <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">You've seen all {movies.length} movies</p>
      )}
    </>
  );
}
