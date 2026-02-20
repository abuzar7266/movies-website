import { Pencil, Trash2 } from "lucide-react";
import StarRating from "@components/StarRating";
import type { Review } from "@src/types/movie";
import { sampleUsers } from "@data/sample-data";
import styles from "./ReviewCard.module.css";

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
}

export default function ReviewCard({ review, currentUserId, onEdit, onDelete }: ReviewCardProps) {
  const fallbackAuthor = sampleUsers.find((u) => u.id === review.userId);
  const author = review.author || (fallbackAuthor ? { id: fallbackAuthor.id, name: fallbackAuthor.name, avatarUrl: fallbackAuthor.avatarUrl } : undefined);
  const canManage = Boolean(currentUserId && review.userId === currentUserId);
  const initials = (author?.name || "User").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.authorRow}>
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.name} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarFallback}>
              {initials}
            </div>
          )}
          <div className={styles.authorMeta}>
            <p className={styles.authorName}>{author?.name || "User"}</p>
            <p className={styles.timestamp}>{new Date(review.createdAt).toLocaleString()}</p>
          </div>
        </div>
        {canManage && (
          <div className={styles.actions}>
            <button
              onClick={() => onEdit(review)}
              className={styles.iconButton}
              aria-label="Edit review"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(review.id)}
              className={styles.iconButton}
              aria-label="Delete review"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      {review.rating > 0 && (
        <div className={styles.ratingRow}>
          <StarRating rating={review.rating} />
        </div>
      )}
      <p className={styles.content}>{review.content}</p>
    </div>
  );
}
