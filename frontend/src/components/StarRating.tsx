import { Star } from "lucide-react";
import styles from "./StarRating.module.css";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const StarRating = ({ rating, maxStars = 5, size = 16, interactive = false, onRate }: StarRatingProps) => {
  return (
    <div className={styles.root}>
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={[
            styles.star,
            i < rating ? styles.filled : styles.empty,
            interactive ? styles.interactive : "",
          ].filter(Boolean).join(" ")}
          onClick={() => interactive && onRate?.(i + 1)}
        />
      ))}
    </div>
  );
};

export default StarRating;
