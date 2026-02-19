import { Pencil, Trash2 } from "lucide-react";
import StarRating from "../StarRating";
import type { Review } from "../../types/movie";
import { sampleUsers } from "../../data/sample-data";

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
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] grid place-items-center text-xs font-semibold">
              {initials}
            </div>
          )}
          <div className="text-sm">
            <p className="font-medium">{author?.name || "User"}</p>
            <p className="text-[hsl(var(--muted-foreground))]">{new Date(review.createdAt).toLocaleString()}</p>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(review)}
              className="rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label="Edit review"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(review.id)}
              className="rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label="Delete review"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      {review.rating > 0 && (
        <div className="mb-2">
          <StarRating rating={review.rating} />
        </div>
      )}
      <p className="text-sm leading-relaxed text-[hsl(var(--foreground))]">{review.content}</p>
    </div>
  );
}
