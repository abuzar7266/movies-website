import { Link } from "react-router-dom"

function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">The page you are looking for does not exist.</p>
      <Link to="/" className="text-indigo-600 hover:underline">Go back home</Link>
    </div>
  )
}

export default NotFound
