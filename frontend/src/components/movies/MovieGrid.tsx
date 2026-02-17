import type { MovieWithStats } from "../../types/movie";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: MovieWithStats[];
}

export function MovieGrid({ movies }: MovieGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {movies.map((m) => (
        <MovieCard key={m.id} movie={m} />
      ))}
    </div>
  );
}
