import { useParams } from "react-router-dom"
import { useMovies } from "../context/MovieContext"
import StarRating from "../components/StarRating"
import { Separator } from "../components/ui/separator"
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"
import { useState } from "react"
import { useAuth } from "../context/AuthContext"

function MovieDetail() {
  const { id } = useParams()
  const { getMovieById, getMovieStats, getReviewsForMovie, addReview } = useMovies()
  const movie = id ? getMovieById(id) : undefined
  const stats = id ? getMovieStats(id) : { reviewCount: 0, averageRating: 0, rank: 0 }
  const reviews = id ? getReviewsForMovie(id) : []
  const { user } = useAuth()
  const [newRating, setNewRating] = useState(5)
  const [content, setContent] = useState("")

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!movie) return
    addReview({
      movieId: movie.id,
      userId: user?.id ?? "user-1",
      rating: newRating,
      content: content.trim(),
    })
    setContent("")
  }

  if (!movie) {
    return <p className="text-sm text-gray-600 dark:text-gray-300">Movie not found.</p>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <img src={movie.posterUrl} alt={movie.title} className="w-full rounded-md object-cover md:h-[360px]" />
        <div>
          <h1 className="text-3xl font-semibold">{movie.title}</h1>
          <p className="text-sm text-gray-500">{new Date(movie.releaseDate).toDateString()}</p>
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={Math.round(stats.averageRating)} size={18} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {stats.averageRating.toFixed(1)} • {stats.reviewCount} reviews • Rank #{stats.rank || "-"}
            </span>
          </div>
          <Separator className="my-4" />
          <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">{movie.synopsis}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Reviews</h2>
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-md border p-3 dark:border-gray-800">
              <div className="mb-1 flex items-center justify-between">
                <StarRating rating={r.rating} />
                <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">{r.content}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Add Your Review</h3>
        <form onSubmit={submitReview} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Your rating:</span>
            <StarRating rating={newRating} interactive onRate={setNewRating} />
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            required
          />
          <Button type="submit">Submit Review</Button>
        </form>
      </section>
    </div>
  )
}

export default MovieDetail
