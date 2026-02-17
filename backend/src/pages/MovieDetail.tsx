import { useParams } from "react-router-dom"

function MovieDetail() {
  const { id } = useParams()
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Movie Detail</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">Movie ID: {id}</p>
    </div>
  )
}

export default MovieDetail
