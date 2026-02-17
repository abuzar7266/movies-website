import { Link, NavLink } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../ui/button"

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  return (
    <header className="border-b bg-white/70 backdrop-blur dark:bg-gray-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link to="/" className="text-lg font-semibold">
          MovieShelf
        </Link>
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {user?.avatarUrl && <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />}
            <span className="text-sm text-gray-700 dark:text-gray-200">{user?.name}</span>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        ) : (
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/" className={({ isActive }) => isActive ? "text-indigo-600" : "text-gray-600 dark:text-gray-300"}>
              Home
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => isActive ? "text-indigo-600" : "text-gray-600 dark:text-gray-300"}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? "text-indigo-600" : "text-gray-600 dark:text-gray-300"}>
              Register
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Navbar
