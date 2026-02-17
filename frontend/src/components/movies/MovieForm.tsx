import { useState } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useMovies } from "../../context/MovieContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../hooks/use-toast";

export function MovieForm({ onCreated }: { onCreated?: () => void }) {
  const { addMovie } = useMovies();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    releaseDate: "",
    posterUrl: "",
    trailerUrl: "",
    synopsis: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = addMovie({
      title: form.title.trim(),
      releaseDate: form.releaseDate,
      posterUrl: form.posterUrl.trim(),
      trailerUrl: form.trailerUrl.trim(),
      synopsis: form.synopsis.trim(),
      createdBy: user?.id ?? "user-1",
    });
    if (success) {
      toast.success("Movie added");
      setForm({ title: "", releaseDate: "", posterUrl: "", trailerUrl: "", synopsis: "" });
      onCreated?.();
    } else {
      toast.error("A movie with this title already exists");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Release Date</label>
        <Input type="date" value={form.releaseDate} onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Poster URL</label>
        <Input value={form.posterUrl} onChange={(e) => setForm((f) => ({ ...f, posterUrl: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Trailer URL</label>
        <Input value={form.trailerUrl} onChange={(e) => setForm((f) => ({ ...f, trailerUrl: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Synopsis</label>
        <Textarea value={form.synopsis} onChange={(e) => setForm((f) => ({ ...f, synopsis: e.target.value }))} rows={4} required />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Add Movie</Button>
      </div>
    </form>
  );
}
