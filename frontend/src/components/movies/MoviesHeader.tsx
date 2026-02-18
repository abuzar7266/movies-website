export default function MoviesHeader({ count }: { count: number }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground">All Movies</h2>
      <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
        {count} movies · Ranked by review count
      </p>
    </div>
  );
}
