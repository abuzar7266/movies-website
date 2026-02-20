import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useMovies } from "@context/MovieContext"
import { useAuth } from "@context/AuthContext"
import { sampleUsers } from "@data/sample-data"
import StarRating from "@components/StarRating"
import ReviewCard from "@components/review/ReviewCard"
import ReviewForm from "@components/review/ReviewForm"
import { Button } from "@components/ui/button"
import LoginRequiredDialog from "@components/auth/LoginRequiredDialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog"
import { ArrowLeft, Calendar, Loader2, MessageSquare, Trash2, Trophy } from "lucide-react"
import MovieForm from "@components/movies/MovieForm"
import { toEmbedUrl } from "@lib/utils"
import { toast } from "@hooks/use-toast"
import { API_BASE, ApiError, apiUrl, mediaApi, moviesApi, ratingsApi, reviewsApi } from "@api"
import type { MovieDTO, ReviewDTO } from "@src/types/api"
import type { Movie, Review } from "@src/types/movie"
import styles from "./MovieDetail.module.css"

function MovieDetailSkeleton() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={`${styles.skeletonTitleBlock} ${styles.pulse}`} />
        <div className={styles.skeletonLayout}>
          <div className={styles.posterCol}>
            <div className={`${styles.skeletonPosterBlock} ${styles.pulse}`} />
          </div>
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonStackSm}>
              <div className={`${styles.skeletonLineLg} ${styles.pulse}`} />
              <div className={`${styles.skeletonLineSm} ${styles.pulse}`} />
            </div>
            <div className={styles.skeletonRow}>
              <div className={`${styles.skeletonChip} ${styles.pulse}`} />
              <div className={`${styles.skeletonChipSm} ${styles.pulse}`} />
              <div className={`${styles.skeletonChipWide} ${styles.pulse}`} />
            </div>
            <div className={styles.skeletonParagraph}>
              <div className={`${styles.skeletonParaLine} ${styles.pulse}`} />
              <div className={`${styles.skeletonParaLine} ${styles.skeletonParaLine90} ${styles.pulse}`} />
              <div className={`${styles.skeletonParaLine} ${styles.skeletonParaLine80} ${styles.pulse}`} />
            </div>
          </div>
        </div>
        <section className={styles.section}>
          <div className={`${styles.skeletonChip} ${styles.skeletonSectionTitleShort} ${styles.pulse}`} />
          <div className={`${styles.trailerFrame} ${styles.skeletonTrailerFrame} ${styles.pulse}`} />
        </section>
        <section className={styles.section}>
          <div className={`${styles.skeletonChip} ${styles.skeletonSectionTitleLong} ${styles.pulse}`} />
          <div className={styles.reviewsLoading}>
            <div className={`${styles.skeletonCard} ${styles.pulse}`} />
            <div className={`${styles.skeletonCard} ${styles.pulse}`} />
            <div className={`${styles.skeletonCard} ${styles.pulse}`} />
          </div>
        </section>
      </main>
    </div>
  )
}

function DetailHeader({ movie, stats, owner, isOwner, onEdit, onDelete, userRating, onRate }: {
  movie: Movie;
  stats: { averageRating: number; reviewCount: number; rank: number };
  owner?: { name: string } | undefined;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  userRating?: number | null;
  onRate?: (value: number) => void;
}) {
  return (
    <div className={`${styles.header} animate-fade-in`}>
      <div className={styles.posterCol}>
        <div className={styles.posterFrame}>
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className={styles.posterImg}
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
      <div className={styles.headerBody}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>{movie.title}</h1>
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <Calendar size={14} /> {new Date(movie.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              {owner && <span>Added by {owner.name}</span>}
            </div>
          </div>
          {stats.rank > 0 && (
            <div className={styles.rankBadge}>
              <Trophy size={14} />
              <span>Rank #{stats.rank}</span>
            </div>
          )}
        </div>
        <div className={styles.statsRow}>
          <div className={styles.ratingGroup}>
            <StarRating rating={Math.round(stats.averageRating)} size={20} />
            <span className={styles.avgRating}>{stats.averageRating.toFixed(1)}</span>
          </div>
          <span className={styles.reviewCount}>
            <MessageSquare size={14} /> {stats.reviewCount} reviews
          </span>
          {onRate && (
            <div className={styles.userRating}>
              <span className={styles.userRatingLabel}>Your rating</span>
              <StarRating rating={userRating ?? 0} interactive onRate={onRate} />
            </div>
          )}
        </div>
        {isOwner && (
          <div className={styles.ownerActions}>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className={styles.destructiveButton}>
              <Trash2 size={14} className={styles.deleteIcon} /> Delete
            </Button>
          </div>
        )}
        <div>
          <h3 className={styles.synopsisTitle}>Synopsis</h3>
          <p className={styles.synopsisText}>{movie.synopsis}</p>
        </div>
      </div>
    </div>
  );
}

function TrailerSection({ title, url }: { title: string; url: string }) {
  if (!url) return null;
  return (
    <section className={`${styles.section} animate-slide-up`}>
      <h3 className={styles.sectionTitle}>Trailer</h3>
      <div className={styles.trailerFrame}>
        <iframe
          src={toEmbedUrl(url)}
          title={`${title} Trailer`}
          className={styles.trailerIframe}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}

function ReviewsSection({ reviews, loading, isAuthenticated, currentUserId, canStartNew, initialRating, onStartNew, onLogin, onSubmit, onCancel, onEdit, onDelete, showReviewForm, editingReview }: {
  reviews: Review[];
  loading?: boolean;
  isAuthenticated: boolean;
  currentUserId?: string;
  canStartNew: boolean;
  initialRating?: number;
  onStartNew: () => void;
  onLogin: () => void;
  onSubmit: (rating: number, content: string) => void | Promise<void>;
  onCancel: () => void;
  onEdit: (r: Review) => void;
  onDelete: (id: string) => void;
  showReviewForm: boolean;
  editingReview: Review | null;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.reviewsHeader}>
        <h3 className={styles.reviewsTitle}>Reviews ({reviews.length})</h3>
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
        <div className={styles.reviewFormWrap}>
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
        <div className={styles.reviewsLoading}>
          <div className={`${styles.skeletonCard} ${styles.pulse}`} />
          <div className={`${styles.skeletonCard} ${styles.pulse}`} />
          <div className={`${styles.skeletonCard} ${styles.pulse}`} />
        </div>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.length === 0 ? (
            <p className={styles.emptyReviews}>No reviews yet. Be the first to share your thoughts!</p>
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

function mapMovieDtoToMovie(m: MovieDTO): Movie {
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

function mapReviewDtoToReview(r: ReviewDTO): Review {
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
  } as Review
}

function useRemoteMovieData(id: string | undefined, reloadKey: number) {
  const [movie, setMovie] = useState<Movie | null>(null)
  const [stats, setStats] = useState<RemoteStats | null>(null)
  const [myRating, setMyRating] = useState<number | null>(null)
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
        setMyRating(res.data.myRating ?? null)
      } catch (e) {
        if (cancelled) return
        setMovie(null)
        setStats(null)
        setMyRating(null)
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

  return { movie, stats, setStats, myRating, setMyRating, loading, notFound, loadFailed }
}

function useRemoteReviewsData(id: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([])
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

function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getMovieById, getReviewsForMovie, getMovieStats, deleteMovie, addReview, updateReview, deleteReview, updateMovie } = useMovies()
  const { user, isAuthenticated } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [draftReviewRating, setDraftReviewRating] = useState<number | undefined>(undefined)
  const [showEditMovie, setShowEditMovie] = useState(false)
  const reviewsSectionRef = useRef<HTMLDivElement | null>(null)
  const [confirmDeleteMovieOpen, setConfirmDeleteMovieOpen] = useState(false)
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [reloadKey, setReloadKey] = useState(0)

  const remoteMovie = useRemoteMovieData(id, reloadKey)
  const remoteReviews = useRemoteReviewsData(id)

  const movie = API_BASE ? remoteMovie.movie : getMovieById(id || "")
  if (API_BASE) {
    if (remoteMovie.loading && !movie) return <MovieDetailSkeleton />
    if (remoteMovie.loadFailed && !movie) {
      return (
        <div className={`${styles.page} ${styles.centerPage}`}>
          <div className={styles.centerContent}>
            <h1 className={styles.centerTitle}>Failed to load movie</h1>
            <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>Retry</Button>
          </div>
        </div>
      )
    }
    if (remoteMovie.notFound && !movie) {
      return (
        <div className={`${styles.page} ${styles.centerPage}`}>
          <div className={styles.centerContent}>
            <h1 className={styles.centerTitle}>Movie not found</h1>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft size={16} className={styles.deleteIcon} /> Back to Home
            </Button>
          </div>
        </div>
      )
    }
    if (!movie) return <MovieDetailSkeleton />
  }
  if (!movie) {
    return (
      <div className={`${styles.page} ${styles.centerPage}`}>
        <div className={styles.centerContent}>
          <h1 className={styles.centerTitle}>Movie not found</h1>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft size={16} className={styles.deleteIcon} /> Back to Home
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
  const displayedUserRating = API_BASE ? (hasMyReview ? remoteMovie.myRating : null) : undefined

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
        remoteMovie.setMyRating(value);
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
      remoteMovie.setMyRating(rating)
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

  const handleEditReview = (review: Review) => {
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
      if (target?.userId === user.id) remoteMovie.setMyRating(null)
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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className={styles.backButton}>
          <ArrowLeft size={16} className={styles.deleteIcon} /> Back to Movies
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
            initialRating={editingReview ? (API_BASE ? (remoteMovie.myRating ?? 5) : editingReview.rating) : draftReviewRating}
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
            <Button onClick={deleteMovieConfirmed} disabled={deleting} className={styles.destructiveButton}>
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
              className={styles.destructiveButton}
            >
              {deleting && <Loader2 size={16} className={`${styles.deleteIcon} ${styles.spin}`} />}
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
