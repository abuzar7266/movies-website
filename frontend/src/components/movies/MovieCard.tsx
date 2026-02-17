import { Link } from "react-router-dom";
import RankBadge from "../RankBadge";
import StarRating from "../StarRating";
import { MessageSquare } from "lucide-react";
import type { MovieWithStats } from "../../types/movie";

interface MovieCardProps {
  movie: MovieWithStats;
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link to={`/movie/${movie.id}`} className="group block">
      <div className="card-hover-lift relative overflow-hidden rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <RankBadge rank={movie.rank} />
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--card))] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-3 space-y-1.5">
          <h3 className="text-sm font-semibold truncate text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
            {movie.title}
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {new Date(movie.releaseDate).getFullYear()}
          </p>
          <div className="flex items-center justify-between">
            <StarRating rating={Math.round(movie.averageRating)} size={12} />
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
              <MessageSquare size={11} />
              <span>{movie.reviewCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
