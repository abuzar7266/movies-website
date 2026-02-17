import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import RankBadge from "../RankBadge";
import StarRating from "../StarRating";
import type { MovieWithStats } from "../../types/movie";

interface MovieCardProps {
  movie: MovieWithStats;
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link to={`/movie/${movie.id}`}>
      <Card className="relative overflow-hidden transition-transform hover:scale-[1.01]">
        <RankBadge rank={movie.rank} />
        <img src={movie.posterUrl} alt={movie.title} className="h-64 w-full object-cover" />
        <CardHeader>
          <CardTitle className="text-base">{movie.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between pt-0">
          <span className="text-xs text-gray-500">{new Date(movie.releaseDate).getFullYear()}</span>
          <StarRating rating={Math.round(movie.averageRating)} />
        </CardContent>
      </Card>
    </Link>
  );
}
