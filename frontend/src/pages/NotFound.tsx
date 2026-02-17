import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Film } from "lucide-react"

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Film size={20} className="text-[hsl(var(--primary))]" />
          <span className="font-display text-lg font-semibold gold-text">MovieShelf</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Page not found</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">The page you are looking for does not exist.</p>
        <Button asChild>
          <Link to="/">Go back home</Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
