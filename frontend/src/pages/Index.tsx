import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import HeroSection from "../components/HeroSection"
import FiltersBar from "../components/filters/FiltersBar"
import MoviesHeader from "../components/movies/MoviesHeader"
import { useMovies } from "../context/MovieContext"
import { MovieGrid } from "../components/movies/MovieGrid"
import { useAuth } from "../context/AuthContext"
import MovieForm from "../components/movies/MovieForm"
import LoginRequiredDialog from "../components/auth/LoginRequiredDialog"
import { toEmbedUrl } from "../lib/utils"
import { QUERY_Q, QUERY_SCOPE, QUERY_SORT, QUERY_STARS } from "../lib/keys"
import type { StarsValue, ReviewScope, SortKey } from "../lib/options"
import { toast } from "../hooks/use-toast"
import type { MovieWithStats } from "../types/movie"
import { api, API_BASE } from "../lib/api"

function Index() {
  const { addMovie, queryMovies } = useMovies()
  const { user, isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get(QUERY_Q) || "")
  const [formError, setFormError] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [minStars, setMinStars] = useState<StarsValue>((searchParams.get(QUERY_STARS) as StarsValue) || "0")
  const [reviewScope, setReviewScope] = useState<ReviewScope>((searchParams.get(QUERY_SCOPE) as ReviewScope) || "all")
  const [sortBy, setSortBy] = useState<SortKey>((searchParams.get(QUERY_SORT) as SortKey) || "reviews_desc")
  const [page, setPage] = useState(1)
  const [remoteMovies, setRemoteMovies] = useState<MovieWithStats[]>([])
  const [loadingRemote, setLoadingRemote] = useState(false)

  const wantsAdd = searchParams.get("add") === "true"
  const showAddForm = wantsAdd && isAuthenticated
  if (wantsAdd && !isAuthenticated && !showLoginDialog) {
    // prompt login then clear param
    setShowLoginDialog(true)
  }
  useEffect(() => {
    const next = new URLSearchParams()
    if (searchQuery) next.set(QUERY_Q, searchQuery); else next.delete(QUERY_Q)
    if (minStars !== "0") next.set(QUERY_STARS, minStars); else next.delete(QUERY_STARS)
    if (reviewScope !== "all") next.set(QUERY_SCOPE, reviewScope); else next.delete(QUERY_SCOPE)
    if (sortBy !== "reviews_desc") next.set(QUERY_SORT, sortBy); else next.delete(QUERY_SORT)
    setSearchParams(next, { replace: true })
    setPage(1)
  }, [searchQuery, minStars, reviewScope, sortBy, setSearchParams])

  const resultsWithReviewScope = useMemo(() => {
    return queryMovies({
      search: searchQuery,
      minStars: Number(minStars),
      reviewScope,
      sortBy,
      userId: user?.id,
    })
  }, [searchQuery, minStars, reviewScope, sortBy, user, queryMovies])

  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    const run = async () => {
      setLoadingRemote(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set("q", searchQuery)
        if (minStars !== "0") params.set("minStars", String(minStars))
        if (reviewScope) params.set("reviewScope", reviewScope)
        if (sortBy) params.set("sort", sortBy)
        params.set("page", String(page))
        params.set("pageSize", "60")
        const res = await api.get<{ success: true; data: { items: Array<any>; total: number; page: number; pageSize: number } }>(`/movies?${params.toString()}`)
        if (cancelled) return
        const mapped: MovieWithStats[] = res.data.items.map((m: any) => ({
          id: m.id,
          title: m.title,
          releaseDate: new Date(m.releaseDate).toISOString(),
          posterUrl: m.posterMediaId ? `${API_BASE}/media/${m.posterMediaId}` : "https://placehold.co/480x720?text=Poster",
          trailerUrl: "",
          synopsis: m.synopsis,
          createdBy: m.createdBy,
          createdAt: new Date(m.createdAt).toISOString(),
          reviewCount: m.reviewCount ?? 0,
          averageRating: m.averageRating ?? 0,
          rank: m.rank ?? 0,
        }))
        setRemoteMovies(mapped)
      } catch {
        setRemoteMovies([])
      } finally {
        setLoadingRemote(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [searchQuery, minStars, reviewScope, sortBy, page])

  const handleAddMovie = (data: { title: string; releaseDate: string; posterUrl: string; trailerUrl: string; synopsis: string }) => {
    if (!user) return
    const success = addMovie({
      title: data.title,
      releaseDate: data.releaseDate,
      posterUrl: data.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500",
      trailerUrl: toEmbedUrl(data.trailerUrl || ""),
      synopsis: data.synopsis,
      createdBy: user.id,
    })
    if (success) {
      setSearchParams({})
      setFormError("")
      toast.success("Movie added")
    } else {
      setFormError("A movie with this title already exists.")
      toast.error("Movie already exists")
    }
  }
  const moviesToShow = API_BASE ? remoteMovies : resultsWithReviewScope

  return (
    <div className="bg-background">
      <HeroSection />
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-5 lg:px-6 py-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <MoviesHeader count={moviesToShow.length} />
          <FiltersBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            minStars={minStars}
            onMinStars={setMinStars}
            reviewScope={reviewScope}
            onReviewScope={setReviewScope}
            sortBy={sortBy}
            onSortBy={setSortBy}
            isAuthenticated={isAuthenticated}
            onRequireLogin={() => setShowLoginDialog(true)}
          />
        </div>
        {loadingRemote && API_BASE ? (
          <div className="py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading movies…</div>
        ) : (
          <MovieGrid key={`${searchQuery}-${minStars}-${reviewScope}-${sortBy}-${page}-${API_BASE ? "remote" : "local"}`} movies={moviesToShow} />
        )}
      </section>
      {showAddForm && (
        <MovieForm
          onSubmit={handleAddMovie}
          onClose={() => setSearchParams({})}
          error={formError}
        />
      )}
      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={(open) => {
          setShowLoginDialog(open)
          if (!open && wantsAdd) setSearchParams({})
        }}
        message={wantsAdd ? "Please log in to add a new movie." : "Please log in to use this filter."}
      />
    </div>
  )
}

export default Index
