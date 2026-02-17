import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const StarRating = ({ rating, maxStars = 5, size = 16, interactive = false, onRate }: StarRatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={`${i < rating ? "star-filled fill-current" : "star-empty"} ${interactive ? "cursor-pointer transition-transform hover:scale-125" : ""}`}
          onClick={() => interactive && onRate?.(i + 1)}
        />
      ))}
    </div>
  );
};

export default StarRating;
