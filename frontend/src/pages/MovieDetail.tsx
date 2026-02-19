import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useMovies } from "../context/MovieContext"
import { useAuth } from "../context/AuthContext"
import { sampleUsers } from "../data/sample-data"
import StarRating from "../components/StarRating"
import ReviewCard from "../components/review/ReviewCard"
import ReviewForm from "../components/review/ReviewForm"
import { Button } from "../components/ui/button"
import LoginRequiredDialog from "../components/auth/LoginRequiredDialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { ArrowLeft, Calendar, Loader2, MessageSquare, Trash2, Trophy } from "lucide-react"
import MovieForm from "../components/movies/MovieForm"
import { toEmbedUrl } from "../lib/utils"
import { toast } from "../hooks/use-toast"
import { API_BASE, ApiError, apiUrl, mediaApi, moviesApi, ratingsApi, reviewsApi } from "../api"
import type { MovieDTO, ReviewDTO } from "../types/api"

function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="mb-6 h-8 w-40 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="h-[480px] w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] animate-pulse" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-3/4 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
              <div className="h-4 w-1/3 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-7 w-28 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
              <div className="h-5 w-24 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
              <div className="ml-auto h-7 w-40 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
              <div className="h-4 w-full rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
              <div className="h-4 w-11/12 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
              <div className="h-4 w-10/12 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
            </div>
          </div>
        </div>
        <section className="mt-10">
          <div className="mb-4 h-6 w-28 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
          <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] animate-pulse" />
        </section>
        <section className="mt-10">
          <div className="mb-4 h-6 w-40 rounded-md bg-[hsl(var(--secondary))] animate-pulse" />
          <div className="space-y-3">
            <div className="h-20 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] animate-pulse" />
            <div className="h-20 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] animate-pulse" />
            <div className="h-20 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] animate-pulse" />
          </div>
        </section>
      </main>
    </div>
  )
}

function DetailHeader({ movie, stats, owner, isOwner, onEdit, onDelete, userRating, onRate }: {
  movie: import("../types/movie").Movie;
  stats: { averageRating: number; reviewCount: number; rank: number };
  owner?: { name: string } | undefined;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  userRating?: number | null;
  onRate?: (value: number) => void;
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
          {stats.rank > 0 && (
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
          {onRate && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Your rating</span>
              <StarRating rating={userRating ?? 0} interactive onRate={onRate} />
            </div>
          )}
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

function ReviewsSection({ reviews, loading, isAuthenticated, currentUserId, canStartNew, initialRating, onStartNew, onLogin, onSubmit, onCancel, onEdit, onDelete, showReviewForm, editingReview }: {
  reviews: Array<import("../types/movie").Review>;
  loading?: boolean;
  isAuthenticated: boolean;
  currentUserId?: string;
  canStartNew: boolean;
  initialRating?: number;
  onStartNew: () => void;
  onLogin: () => void;
  onSubmit: (rating: number, content: string) => void | Promise<void>;
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
            canStartNew ? (
              <Button size="sm" onClick={onStartNew}>
                Write a Review
              </Button>
            ) : null
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
            initialRating={initialRating}
            initialContent={editingReview?.content}
            isEdit={!!editingReview}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </div>
      )}
      {loading ? (
        <div className="space-y-3 py-2">
          <div className="h-20 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] animate-pulse" />
          <div className="h-20 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] animate-pulse" />
          <div className="h-20 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] animate-pulse" />
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No reviews yet. Be the first to share your thoughts!</p>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} currentUserId={currentUserId} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </div>
      )}
    </section>
  );
}

type RemoteStats = { averageRating: number; reviewCount: number; rank: number }

function mapMovieDtoToMovie(m: MovieDTO): import("../types/movie").Movie {
  const candidate = m.posterUrl || (m.posterMediaId ? `/media/${m.posterMediaId}` : "")
  const posterUrl = candidate
    ? candidate.startsWith("http://") || candidate.startsWith("https://")
      ? candidate
      : apiUrl(candidate)
    : "https://placehold.co/480x720?text=Poster"
  return {
    id: m.id,
    title: m.title,
    releaseDate: new Date(m.releaseDate).toISOString(),
    posterUrl,
    trailerUrl: m.trailerUrl || "",
    synopsis: m.synopsis,
    createdBy: m.createdBy,
    createdAt: new Date(m.createdAt).toISOString(),
  }
}

function mapReviewDtoToReview(r: ReviewDTO): import("../types/movie").Review {
  return {
    id: r.id,
    movieId: r.movieId,
    userId: r.userId,
    author: r.user
      ? {
          id: r.user.id,
          name: r.user.name,
          avatarUrl: r.user.avatarMediaId ? apiUrl(`/media/${r.user.avatarMediaId}`) : undefined,
        }
      : undefined,
    rating: 0,
    content: r.content,
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
  } as import("../types/movie").Review
}

function useRemoteMovieData(id: string | undefined, reloadKey: number) {
  const [movie, setMovie] = useState<import("../types/movie").Movie | null>(null)
  const [stats, setStats] = useState<RemoteStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!API_BASE || !id) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setNotFound(false)
      setLoadFailed(false)
      try {
        const res = await moviesApi.getMovie(id)
        if (cancelled) return
        setMovie(mapMovieDtoToMovie(res.data))
        setStats({
          averageRating: res.data.averageRating ?? 0,
          reviewCount: res.data.reviewCount ?? 0,
          rank: res.data.rank ?? 0,
        })
      } catch (e) {
        if (cancelled) return
        setMovie(null)
        setStats(null)
        if (e instanceof ApiError && (e.status === 404 || e.status === 400)) {
          setNotFound(true)
        } else {
          setLoadFailed(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [id, reloadKey])

  return { movie, stats, setStats, loading, notFound, loadFailed }
}

function useRemoteReviewsData(id: string | undefined) {
  const [reviews, setReviews] = useState<Array<import("../types/movie").Review>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!API_BASE || !id) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await reviewsApi.listByMovie(id, 1, 50)
        if (cancelled) return
        setReviews(res.data.items.map(mapReviewDtoToReview))
      } catch {
        if (!cancelled) setReviews([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [id])

  return { reviews, setReviews, loading }
}

function useRemoteUserRating(id: string | undefined, isAuthenticated: boolean) {
  const [rating, setRating] = useState<number | null>(null)

  useEffect(() => {
    if (!API_BASE || !id || !isAuthenticated) return
    ratingsApi.getMyRating(id).then((r) => setRating(r.data.value), () => setRating(null))
  }, [id, isAuthenticated])

  return { rating, setRating }
}

function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getMovieById, getReviewsForMovie, getMovieStats, deleteMovie, addReview, updateReview, deleteReview, updateMovie } = useMovies()
  const { user, isAuthenticated } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<import("../types/movie").Review | null>(null)
  const [draftReviewRating, setDraftReviewRating] = useState<number | undefined>(undefined)
  const [showEditMovie, setShowEditMovie] = useState(false)
  const reviewsSectionRef = useRef<HTMLDivElement | null>(null)
  const [confirmDeleteMovieOpen, setConfirmDeleteMovieOpen] = useState(false)
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [reloadKey, setReloadKey] = useState(0)

  const remoteMovie = useRemoteMovieData(id, reloadKey)
  const remoteReviews = useRemoteReviewsData(id)
  const remoteRating = useRemoteUserRating(id, isAuthenticated)

  const movie = API_BASE ? remoteMovie.movie : getMovieById(id || "")
  if (API_BASE) {
    if (remoteMovie.loading && !movie) return <MovieDetailSkeleton />
    if (remoteMovie.loadFailed && !movie) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-3">
            <h1 className="font-display text-2xl font-bold text-foreground">Failed to load movie</h1>
            <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>Retry</Button>
          </div>
        </div>
      )
    }
    if (remoteMovie.notFound && !movie) {
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
    if (!movie) return <MovieDetailSkeleton />
  }
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

  const reviews = API_BASE ? remoteReviews.reviews : getReviewsForMovie(movie.id)
  const stats = API_BASE ? (remoteMovie.stats || { averageRating: 0, reviewCount: 0, rank: 0 }) : getMovieStats(movie.id)
  const owner = API_BASE ? undefined : sampleUsers.find((u) => u.id === movie.createdBy)
  const isOwner = API_BASE ? false : user?.id === movie.createdBy
  const hasMyReview = Boolean(user && reviews.some((r) => r.userId === user.id))
  const canStartNewReview = Boolean(user && !hasMyReview)
  const displayedUserRating = API_BASE ? (hasMyReview ? remoteRating.rating : null) : undefined

  const deleteMovieConfirmed = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      if (!API_BASE) deleteMovie(movie.id)
      navigate("/")
      toast.success("Movie deleted")
    } finally {
      setDeleting(false)
      setConfirmDeleteMovieOpen(false)
    }
  }

  const handleDeleteMovie = () => {
    setConfirmDeleteMovieOpen(true)
  }
  const handleRateOnly = (value: number) => {
    if (!API_BASE) return
    if (!user) {
      setShowLoginDialog(true)
      return
    }
    if (!hasMyReview) {
      setEditingReview(null)
      setDraftReviewRating(value)
      setShowReviewForm(true)
      window.setTimeout(() => {
        reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 0)
      return
    }
    (async () => {
      try {
        const r = await ratingsApi.upsertRating({ movieId: movie.id, value });
        remoteRating.setRating(value);
        remoteMovie.setStats((prev) => ({ averageRating: r.data.averageRating, reviewCount: prev?.reviewCount ?? 0, rank: prev?.rank ?? 0 }));
        toast.success("Rating saved");
      } catch {
        toast.error("Failed to save rating");
      }
    })();
  };
  const handleSubmitMovie = async (data: { title: string; releaseDate: string; posterUrl: string; trailerUrl: string; synopsis: string }, posterFile?: File | null) => {
    if (!API_BASE) {
      updateMovie(movie.id, {
        title: data.title,
        releaseDate: data.releaseDate,
        posterUrl: data.posterUrl,
        trailerUrl: toEmbedUrl(data.trailerUrl || ""),
        synopsis: data.synopsis,
      });
      setShowEditMovie(false);
      toast.success("Movie updated");
      return;
    }
    try {
      await moviesApi.updateMovie(movie.id, {
        title: data.title,
        releaseDate: data.releaseDate,
        ...(data.trailerUrl ? { trailerUrl: toEmbedUrl(data.trailerUrl) } : {}),
        synopsis: data.synopsis,
        ...(posterFile ? {} : data.posterUrl ? { posterUrl: data.posterUrl } : {}),
      });
      if (posterFile) {
        const upload = await mediaApi.upload(posterFile);
        await moviesApi.setPoster(movie.id, upload.data.id);
      }
      toast.success("Movie updated");
      setShowEditMovie(false);
    } catch {
      toast.error("Failed to update movie");
    }
  }

  const handleSubmitReview = async (rating: number, content: string) => {
    if (!user) {
      setShowLoginDialog(true)
      return
    }
    if (!editingReview && hasMyReview) {
      toast.error("You can only submit one review per movie")
      setShowReviewForm(false)
      return
    }
    setDraftReviewRating(undefined)
    const doLocal = () => {
      if (editingReview) {
        updateReview(editingReview.id, { rating, content })
        setEditingReview(null)
        toast.success("Review updated")
      } else {
        addReview({ movieId: movie.id, userId: user.id, rating, content })
        toast.success("Review added")
      }
      setShowReviewForm(false)
    };
    if (!API_BASE) {
      doLocal();
      return;
    }
    try {
      const ratingRes = await ratingsApi.upsertRating({ movieId: movie.id, value: rating });
      remoteRating.setRating(rating)
      remoteMovie.setStats((prev) => ({
        averageRating: ratingRes.data.averageRating,
        reviewCount: prev?.reviewCount ?? 0,
        rank: prev?.rank ?? 0,
      }))
      if (editingReview) {
        await reviewsApi.updateReview(editingReview.id, { content });
        setEditingReview(null);
        toast.success("Review updated");
      } else {
        await reviewsApi.createReview({ movieId: movie.id, content });
        toast.success("Review added");
        remoteMovie.setStats((prev) => prev ? ({ ...prev, reviewCount: prev.reviewCount + 1 }) : prev)
      }
      const res = await reviewsApi.listByMovie(movie.id, 1, 50);
      remoteReviews.setReviews(res.data.items.map(mapReviewDtoToReview));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setShowLoginDialog(true);
        toast.error("Please log in to submit a review");
      } else {
        toast.error("Failed to submit review");
      }
    } finally {
      setShowReviewForm(false);
    }
  }

  const handleEditReview = (review: import("../types/movie").Review) => {
    if (!user || review.userId !== user.id) {
      toast.error("You can only edit your own review")
      return
    }
    setEditingReview(review)
    setShowReviewForm(true)
  }

  const deleteReviewConfirmed = async (reviewId: string) => {
    if (!user) {
      setShowLoginDialog(true)
      return
    }
    const target = reviews.find((r) => r.id === reviewId)
    if (target && target.userId !== user.id) {
      toast.error("You can only delete your own review")
      return
    }
    if (deleting) return
    setDeleting(true)
    if (!API_BASE) {
      try {
        deleteReview(reviewId);
        if (editingReview?.id === reviewId) {
          setEditingReview(null)
          setShowReviewForm(false)
        }
        toast.success("Review deleted");
      } finally {
        setDeleting(false)
        setConfirmDeleteReviewId(null)
      }
      return
    }
    try {
      await reviewsApi.deleteReview(reviewId);
      remoteReviews.setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (editingReview?.id === reviewId) {
        setEditingReview(null)
        setShowReviewForm(false)
      }
      if (target?.userId === user.id) remoteRating.setRating(null)
      remoteMovie.setStats((prev) => prev ? ({ ...prev, reviewCount: Math.max(0, prev.reviewCount - 1) }) : prev)
      toast.success("Review deleted");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setShowLoginDialog(true)
        toast.error("Please log in to delete a review")
      } else {
        toast.error("Failed to delete review");
      }
    } finally {
      setDeleting(false)
      setConfirmDeleteReviewId(null)
    }
  }

  const handleDeleteReview = (reviewId: string) => {
    setConfirmDeleteReviewId(reviewId)
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
          userRating={displayedUserRating}
          onRate={API_BASE && isAuthenticated ? handleRateOnly : undefined}
        />
        <TrailerSection title={movie.title} url={movie.trailerUrl} />

        <div ref={reviewsSectionRef}>
          <ReviewsSection
            reviews={reviews}
            loading={API_BASE ? remoteReviews.loading : false}
            isAuthenticated={isAuthenticated}
            currentUserId={user?.id}
            canStartNew={canStartNewReview}
            initialRating={editingReview ? (API_BASE ? (remoteRating.rating ?? 5) : editingReview.rating) : draftReviewRating}
            onStartNew={() => {
              if (!canStartNewReview) {
                toast.error("You can only submit one review per movie")
                return
              }
              setEditingReview(null);
              setDraftReviewRating(undefined);
              setShowReviewForm(true);
            }}
            onLogin={() => setShowLoginDialog(true)}
            onSubmit={handleSubmitReview}
            onCancel={() => { setShowReviewForm(false); setEditingReview(null); setDraftReviewRating(undefined); }}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
            showReviewForm={showReviewForm}
            editingReview={editingReview}
          />
        </div>
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
      <Dialog open={confirmDeleteMovieOpen} onOpenChange={setConfirmDeleteMovieOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete movie?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteMovieOpen(false)} disabled={deleting}>Cancel</Button>
            <Button onClick={deleteMovieConfirmed} disabled={deleting} className="text-destructive hover:bg-destructive/10 border-destructive/30">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmDeleteReviewId)} onOpenChange={(open) => { if (!open) setConfirmDeleteReviewId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete review?</DialogTitle>
            <DialogDescription>This will remove your review from this movie.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteReviewId(null)} disabled={deleting}>Cancel</Button>
            <Button
              onClick={() => confirmDeleteReviewId && void deleteReviewConfirmed(confirmDeleteReviewId)}
              disabled={deleting}
              className="text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              {deleting && <Loader2 size={16} className="mr-2 animate-spin" />}
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoginRequiredDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} message="Please log in to continue." />
    </div>
  )
}

export default MovieDetail
