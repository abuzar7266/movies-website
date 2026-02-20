import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@components/ui/button";
import styles from "./MovieForm.module.css";

interface MovieFormData {
  title: string;
  releaseDate: string;
  posterUrl: string;
  trailerUrl: string;
  synopsis: string;
}

interface MovieFormProps {
  initialData?: MovieFormData;
  onSubmit: (data: MovieFormData, posterFile?: File | null) => void | Promise<void>;
  onClose: () => void;
  error?: string;
}

const emptyForm: MovieFormData = {
  title: "",
  releaseDate: "",
  posterUrl: "",
  trailerUrl: "",
  synopsis: "",
};

const MovieForm = ({ initialData, onSubmit, onClose, error }: MovieFormProps) => {
  const [form, setForm] = useState<MovieFormData>(initialData || emptyForm);
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>("");
  useEffect(() => {
    return () => {
      if (posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
    };
  }, [posterPreview]);

  const handlePosterFile = (file: File | null) => {
    if (posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
    setPosterFile(file);
    if (!file) {
      setPosterPreview("");
      return;
    }
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.title.trim() || !form.releaseDate) {
      setValidationError("Title and release date are required.");
      return;
    }
    setValidationError("");
    try {
      setSubmitting(true);
      await onSubmit({ ...form, posterUrl: form.posterUrl }, posterFile);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof MovieFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.headerRow}>
          <h2 className={styles.title}>
            {initialData ? "Edit Movie" : "Add New Movie"}
          </h2>
          <button onClick={onClose} disabled={submitting} className={styles.closeButton} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Movie title"
              className={styles.input}
              required
            />
          </div>

          <div>
            <label className={styles.label}>Release Date *</label>
            <input
              type="date"
              value={form.releaseDate}
              onChange={(e) => handleChange("releaseDate", e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.fileGrid}>
            <div>
              <label className={styles.label}>Poster Image</label>
              <div className={styles.fileRow}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={submitting}
                  onChange={(e) => handlePosterFile(e.target.files?.[0] || null)}
                  className={styles.fileInput}
                />
                <span className={styles.fileHelp}>Max 2MB (png, jpg, webp, gif)</span>
              </div>
            </div>
            <div>
              <label className={styles.label}>Or Poster Image URL</label>
              <input
                type="url"
                value={form.posterUrl}
                disabled={submitting}
                onChange={(e) => handleChange("posterUrl", e.target.value)}
                placeholder="https://..."
                className={styles.input}
              />
            </div>
            {(posterPreview || form.posterUrl) && (
              <div className={styles.previewWrap}>
                <div className={styles.previewFrame}>
                  <img
                    src={posterPreview || form.posterUrl}
                    alt="Poster preview"
                    className={styles.previewImg}
                    onError={(e) => {
                      const t = e.currentTarget;
                      if (!t.dataset.fallback) {
                        t.dataset.fallback = "1";
                        t.src = "https://placehold.co/320x480?text=Poster";
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className={styles.label}>Trailer Video URL</label>
            <input
              type="url"
              value={form.trailerUrl}
              disabled={submitting}
              onChange={(e) => handleChange("trailerUrl", e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              className={styles.input}
            />
          </div>

          <div>
            <label className={styles.label}>Synopsis</label>
            <textarea
              value={form.synopsis}
              disabled={submitting}
              onChange={(e) => handleChange("synopsis", e.target.value)}
              placeholder="Brief description of the movie..."
              rows={3}
              className={styles.textarea}
            />
          </div>

          {(validationError || error) && (
            <p className={styles.error}>{validationError || error}</p>
          )}

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className={styles.flex1}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className={styles.flex1}>
              {submitting && <Loader2 size={16} className={styles.spinner} />}
              {initialData ? (submitting ? "Saving…" : "Save Changes") : (submitting ? "Adding…" : "Add Movie")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MovieForm;
