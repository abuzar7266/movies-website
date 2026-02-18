import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useMovies } from "../context/MovieContext"
import { useAuth } from "../context/AuthContext"
import { sampleUsers } from "../data/sample-data"
import StarRating from "../components/StarRating"
import ReviewCard from "../components/review/ReviewCard"
import ReviewForm from "../components/review/ReviewForm"
import { Button } from "../components/ui/button"
import LoginRequiredDialog from "../components/auth/LoginRequiredDialog"
import { ArrowLeft, Calendar, MessageSquare, Trash2, Trophy } from "lucide-react"
import MovieForm from "../components/movies/MovieForm"
import { toEmbedUrl } from "../lib/utils"
import { toast } from "../hooks/use-toast"

function DetailHeader({ movie, stats, owner, isOwner, onEdit, onDelete }: {
  movie: import("../types/movie").Movie;
  stats: { averageRating: number; reviewCount: number; rank: number };
  owner?: { name: string } | undefined;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-8 animate-fade-in">
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full object-cover"
            onError={(e) => {
              const t = e.currentTarget
              if (!t.dataset.fallback) {
                t.dataset.fallback = "1"
                t.src = "https://placehold.co/480x720?text=Poster"
              }
            }}
            loading="lazy"
          />
        </div>
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{movie.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {new Date(movie.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              {owner && <span>Added by {owner.name}</span>}
            </div>
          </div>
          {stats.rank <= 3 && (
            <div className="rank-badge flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-[hsl(var(--primary-foreground))]">
              <Trophy size={14} />
              <span>Rank #{stats.rank}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(stats.averageRating)} size={20} />
            <span className="text-lg font-semibold text-foreground">{stats.averageRating.toFixed(1)}</span>
          </div>
          <span className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
            <MessageSquare size={14} /> {stats.reviewCount} reviews
          </span>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:bg-destructive/10 border-destructive/30">
              <Trash2 size={14} className="mr-1.5" /> Delete
            </Button>
          </div>
        )}
        <div>
          <h3 className="font-display text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">Synopsis</h3>
          <p className="text-[hsl(var(--secondary-foreground))] leading-relaxed">{movie.synopsis}</p>
        </div>
      </div>
    </div>
  );
}

function TrailerSection({ title, url }: { title: string; url: string }) {
  if (!url) return null;
  return (
    <section className="mt-10 animate-slide-up">
      <h3 className="font-display text-lg font-bold text-foreground mb-4">Trailer</h3>
      <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-[hsl(var(--border))]">
        <iframe
          src={toEmbedUrl(url)}
          title={`${title} Trailer`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}

function ReviewsSection({ reviews, isAuthenticated, onStartNew, onLogin, onSubmit, onCancel, onEdit, onDelete, showReviewForm, editingReview }: {
  reviews: Array<import("../types/movie").Review>;
  isAuthenticated: boolean;
  onStartNew: () => void;
  onLogin: () => void;
  onSubmit: (rating: number, content: string) => void;
  onCancel: () => void;
  onEdit: (r: import("../types/movie").Review) => void;
  onDelete: (id: string) => void;
  showReviewForm: boolean;
  editingReview: import("../types/movie").Review | null;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-foreground">Reviews ({reviews.length})</h3>
        {!showReviewForm && (
          isAuthenticated ? (
            <Button size="sm" onClick={onStartNew}>
              Write a Review
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onLogin}>
              Log in to review
            </Button>
          )
        )}
      </div>
      {showReviewForm && (
        <div className="mb-6">
          <ReviewForm
            initialRating={editingReview?.rating}
            initialContent={editingReview?.content}
            isEdit={!!editingReview}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </div>
      )}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No reviews yet. Be the first to share your thoughts!</p>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </section>
  );
}

function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getMovieById, getReviewsForMovie, getMovieStats, deleteMovie, addReview, updateReview, deleteReview, updateMovie } = useMovies()
  const { user, isAuthenticated } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<import("../types/movie").Review | null>(null)
  const [showEditMovie, setShowEditMovie] = useState(false)

  const movie = getMovieById(id || "")
  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Movie not found</h1>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
            <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const reviews = getReviewsForMovie(movie.id)
  const stats = getMovieStats(movie.id)
  const owner = sampleUsers.find((u) => u.id === movie.createdBy)
  const isOwner = user?.id === movie.createdBy

  const handleDeleteMovie = () => {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      deleteMovie(movie.id)
      navigate("/")
      toast.success("Movie deleted")
    }
  }
  const handleSubmitMovie = (data: { title: string; releaseDate: string; posterUrl: string; trailerUrl: string; synopsis: string }) => {
    updateMovie(movie.id, {
      title: data.title,
      releaseDate: data.releaseDate,
      posterUrl: data.posterUrl,
      trailerUrl: toEmbedUrl(data.trailerUrl || ""),
      synopsis: data.synopsis,
    })
    setShowEditMovie(false)
    toast.success("Movie updated")
  }

  const handleSubmitReview = (rating: number, content: string) => {
    if (!user) return
    if (editingReview) {
      updateReview(editingReview.id, { rating, content })
      setEditingReview(null)
      toast.success("Review updated")
    } else {
      addReview({ movieId: movie.id, userId: user.id, rating, content })
      toast.success("Review added")
    }
    setShowReviewForm(false)
  }

  const handleEditReview = (review: import("../types/movie").Review) => {
    setEditingReview(review)
    setShowReviewForm(true)
  }

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm("Delete this review?")) { deleteReview(reviewId); toast.success("Review deleted") }
  }

  // reserved for future edit modal; keeping layout parity with sample

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Movies
        </Button>

        <DetailHeader
          movie={movie}
          stats={stats}
          owner={owner}
          isOwner={isOwner}
          onEdit={() => setShowEditMovie(true)}
          onDelete={handleDeleteMovie}
        />
        <TrailerSection title={movie.title} url={movie.trailerUrl} />

        <ReviewsSection
          reviews={reviews}
          isAuthenticated={isAuthenticated}
          onStartNew={() => { setEditingReview(null); setShowReviewForm(true); }}
          onLogin={() => setShowLoginDialog(true)}
          onSubmit={handleSubmitReview}
          onCancel={() => { setShowReviewForm(false); setEditingReview(null); }}
          onEdit={handleEditReview}
          onDelete={handleDeleteReview}
          showReviewForm={showReviewForm}
          editingReview={editingReview}
        />
      </main>
      {showEditMovie && (
        <MovieForm
          initialData={{
            title: movie.title,
            releaseDate: movie.releaseDate,
            posterUrl: movie.posterUrl,
            trailerUrl: movie.trailerUrl,
            synopsis: movie.synopsis,
          }}
          onSubmit={handleSubmitMovie}
          onClose={() => setShowEditMovie(false)}
        />
      )}
      <LoginRequiredDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} message="Please log in to write a review." />
    </div>
  )
}

export default MovieDetail
