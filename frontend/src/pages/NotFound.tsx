import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Film } from "lucide-react"
import styles from "./NotFound.module.css"

function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.stack}>
          <div className={styles.brandRow}>
            <Film size={20} className={styles.brandIcon} />
            <span className={styles.brandText}>MovieShelf</span>
          </div>
          <h1 className={styles.title}>Page not found</h1>
          <p className={styles.subtitle}>The page you are looking for does not exist.</p>
          <Button asChild>
            <Link to="/">Go back home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
