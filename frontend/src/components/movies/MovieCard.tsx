import { Link } from "react-router-dom";
import RankBadge from "../RankBadge";
import StarRating from "../StarRating";
import { MessageSquare } from "lucide-react";
import type { MovieWithStats } from "../../types/movie";
import styles from "./MovieCard.module.css";

interface MovieCardProps {
  movie: MovieWithStats;
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link to={`/movie/${movie.id}`} className={styles.link}>
      <div className={styles.card}>
        <RankBadge rank={movie.rank} />
        <div className={styles.posterFrame}>
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className={styles.poster}
            onError={(e) => {
              const t = e.currentTarget
              if (!t.dataset.fallback) {
                t.dataset.fallback = "1"
                t.src = "https://placehold.co/480x720?text=Poster"
              }
            }}
            loading="lazy"
          />
          <div className={styles.posterOverlay} />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>
            {movie.title}
          </h3>
          <p className={styles.year}>
            {new Date(movie.releaseDate).getFullYear()}
          </p>
          <div className={styles.metaRow}>
            <StarRating rating={Math.round(movie.averageRating)} size={12} />
            <div className={styles.reviewCount}>
              <MessageSquare size={11} />
              <span>{movie.reviewCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
