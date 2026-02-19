import { useState } from "react";
import StarRating from "../StarRating";
import { Button } from "../ui/button";
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
    if (!content.trim()) {
      setError("Review content cannot be empty.");
      return;
    }
    setError("");
    try {
      setSubmitting(true);
      await onSubmit(rating, content.trim());
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
