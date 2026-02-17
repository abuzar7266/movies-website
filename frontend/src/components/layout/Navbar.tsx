import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../ui/button"
import { Film, LogOut, Plus } from "lucide-react"
import { toast } from "../../hooks/use-toast"

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[hsl(var(--border))] glass-surface">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-5 lg:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <Film size={24} className="text-[hsl(var(--primary))] transition-transform group-hover:rotate-12" />
          <span className="font-display text-xl font-bold gold-text">MovieShelf</span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button size="sm" onClick={() => navigate("/?add=true")} className="gap-1.5">
                <Plus size={15} />
                <span className="hidden sm:inline">Add Movie</span>
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] py-1 pl-1 pr-3">
                {user?.avatarUrl && <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-full object-cover" />}
                <span className="hidden text-sm sm:inline">{user?.name}</span>
              </div>
              <button
                onClick={() => { logout(); toast.success("Logged out"); navigate("/"); }}
                className="rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] transition-colors"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log In</Button>
              <Button size="sm" onClick={() => navigate("/register")}>Sign Up</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
