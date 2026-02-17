import { Link, NavLink } from "react-router-dom"

function Navbar() {
  return (
    <header className="border-b bg-white/70 backdrop-blur dark:bg-gray-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link to="/" className="text-lg font-semibold">
          MovieShelf
        </Link>
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
      </div>
    </header>
  )
}

export default Navbar
