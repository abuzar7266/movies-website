import { Pencil, Trash2 } from "lucide-react";
import StarRating from "../StarRating";
import type { Review } from "../../types/movie";
import { sampleUsers } from "../../data/sample-data";

interface ReviewCardProps {
  review: Review;
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
}

export default function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const author = sampleUsers.find((u) => u.id === review.userId);

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {author?.avatarUrl && <img src={author.avatarUrl} alt={author.name} className="h-8 w-8 rounded-full object-cover" />}
          <div className="text-sm">
            <p className="font-medium">{author?.name || "User"}</p>
            <p className="text-[hsl(var(--muted-foreground))]">{new Date(review.createdAt).toLocaleString()}</p>
          </div>
        </div>
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
      </div>
      <div className="mb-2">
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm leading-relaxed text-[hsl(var(--foreground))]">{review.content}</p>
    </div>
  );
}
