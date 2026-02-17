import { useState } from "react";
import StarRating from "../StarRating";
import { Button } from "../ui/button";

interface ReviewFormProps {
  initialRating?: number;
  initialContent?: string;
  isEdit?: boolean;
  onSubmit: (rating: number, content: string) => void;
  onCancel: () => void;
}

export default function ReviewForm({
  initialRating = 5,
  initialContent = "",
  isEdit = false,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Review content cannot be empty.");
      return;
    }
    setError("");
    onSubmit(rating, content.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">Your rating:</span>
        <StarRating rating={rating} interactive onRate={setRating} />
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        rows={3}
        className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEdit ? "Save Review" : "Post Review"}</Button>
      </div>
    </form>
  );
}
