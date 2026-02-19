import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "../ui/button";

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

  const inputClasses = "w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] px-3 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all";

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">
            {initialData ? "Edit Movie" : "Add New Movie"}
          </h2>
          <button onClick={onClose} disabled={submitting} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors disabled:opacity-50" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Movie title"
              className={inputClasses}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Release Date *</label>
            <input
              type="date"
              value={form.releaseDate}
              onChange={(e) => handleChange("releaseDate", e.target.value)}
              className={inputClasses}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Poster Image</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  disabled={submitting}
                  onChange={(e) => handlePosterFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Max 2MB (png, jpg, webp, gif)</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Or Poster Image URL</label>
              <input
                type="url"
                value={form.posterUrl}
                disabled={submitting}
                onChange={(e) => handleChange("posterUrl", e.target.value)}
                placeholder="https://..."
                className={inputClasses}
              />
            </div>
            {(posterPreview || form.posterUrl) && (
              <div className="mt-1">
                <div className="overflow-hidden rounded-md border border-[hsl(var(--border))] w-32">
                  <img
                    src={posterPreview || form.posterUrl}
                    alt="Poster preview"
                    className="block h-48 w-32 object-cover"
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">Trailer Video URL</label>
            <input
              type="url"
              value={form.trailerUrl}
              disabled={submitting}
              onChange={(e) => handleChange("trailerUrl", e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              className={inputClasses}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Synopsis</label>
            <textarea
              value={form.synopsis}
              disabled={submitting}
              onChange={(e) => handleChange("synopsis", e.target.value)}
              placeholder="Brief description of the movie..."
              rows={3}
              className={inputClasses + " resize-none"}
            />
          </div>

          {(validationError || error) && (
            <p className="text-sm text-destructive">{validationError || error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? (submitting ? "Saving…" : "Save Changes") : (submitting ? "Adding…" : "Add Movie")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MovieForm;
