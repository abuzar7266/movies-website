import { Film } from "lucide-react"
import styles from "./Footer.module.css"

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandRow}>
          <Film size={18} className={styles.brandIcon} />
          <span className={styles.brandText}>MovieShelf</span>
        </div>
        <p className={styles.tagline}>Discover, review, and curate your movie collection.</p>
      </div>
    </footer>
  )
}

export default Footer
