export default function MoviesHeader({ count, sortLabel }: { count: number; sortLabel: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground">All Movies</h2>
      <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
        {count} movies · Sorted by {sortLabel.toLowerCase()}
      </p>
    </div>
  );
}
