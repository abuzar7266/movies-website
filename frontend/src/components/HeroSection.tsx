import { Sparkles } from "lucide-react";
import styles from "./HeroSection.module.css";

const HeroSection = () => (
  <section className={styles.section}>
    <div className={styles.container}>
      <div className={styles.pill}>
        <Sparkles size={13} className={styles.pillIcon} />
        <span className={styles.pillText}>Ranked by community reviews</span>
      </div>
      <h1 className={styles.title}>
        Discover & Review<br />
        <span className={styles.gold}>Great Cinema</span>
      </h1>
      <p className={styles.subtitle}>
        Explore a curated collection of movies, watch trailers, and share your reviews with the community.
      </p>
    </div>
    <div className={styles.orb} />
  </section>
);

export default HeroSection;
