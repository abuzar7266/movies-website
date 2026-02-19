import styles from "./MoviesHeader.module.css";

export default function MoviesHeader({ count, sortLabel }: { count: number; sortLabel: string }) {
  return (
    <div>
      <h2 className={styles.title}>All Movies</h2>
      <p className={styles.subtitle}>
        {count} movies · Sorted by {sortLabel.toLowerCase()}
      </p>
    </div>
  );
}
