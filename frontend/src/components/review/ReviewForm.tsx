import { useState } from "react";
import StarRating from "@components/StarRating";
import { Button } from "@components/ui/button";
import { Loader2 } from "lucide-react";
import styles from "./ReviewForm.module.css";

interface ReviewFormProps {
  initialRating?: number;
  initialContent?: string;
  isEdit?: boolean;
  onSubmit: (rating: number, content: string) => void | Promise<void>;
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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = content.trim();
    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (trimmed.length < 10) {
      setError("Review must be at least 10 characters.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Review cannot exceed 1000 characters.");
      return;
    }
    setError("");
    try {
      setSubmitting(true);
      await onSubmit(rating, trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.ratingRow}>
        <span className={styles.ratingLabel}>Your rating:</span>
        <StarRating rating={rating} interactive={!submitting} onRate={setRating} />
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        rows={3}
        disabled={submitting}
        className={styles.textarea}
      />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 size={16} className={styles.spinner} />}
          {isEdit ? (submitting ? "Saving…" : "Save Review") : (submitting ? "Posting…" : "Post Review")}
        </Button>
      </div>
    </form>
  );
}
