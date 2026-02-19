import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import type { MovieDTO } from "../types/api"
import { API_BASE, ApiError, apiUrl, mediaApi, moviesApi } from "../api"
import { DEFAULT_LABELS_EN, makeSortOptions } from "../lib/options"

const DEFAULT_MIN_STARS: StarsValue = "0"
const DEFAULT_REVIEW_SCOPE: ReviewScope = "all"
const DEFAULT_SORT_BY: SortKey = "rank_asc"

const STARS_VALUES = ["0", "1", "2", "3", "4", "5"] as const satisfies readonly StarsValue[]
const REVIEW_SCOPES = ["all", "mine", "not_mine"] as const satisfies readonly ReviewScope[]
const SORT_KEYS = ["rank_asc", "reviews_desc", "rating_desc", "release_desc", "release_asc", "uploaded_desc"] as const satisfies readonly SortKey[]

function parseStarsValue(raw: string | null, fallback: StarsValue): StarsValue {
  if (raw && (STARS_VALUES as readonly string[]).includes(raw)) return raw as StarsValue
  return fallback
}

function parseReviewScope(raw: string | null, fallback: ReviewScope): ReviewScope {
  if (raw && (REVIEW_SCOPES as readonly string[]).includes(raw)) return raw as ReviewScope
  return fallback
}

function parseSortKey(raw: string | null, fallback: SortKey): SortKey {
  if (raw && (SORT_KEYS as readonly string[]).includes(raw)) return raw as SortKey
  return fallback
}

function Index() {
  const { addMovie, queryMovies } = useMovies()
  const { user, isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get(QUERY_Q) || "")
  const [formError, setFormError] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [minStars, setMinStars] = useState<StarsValue>(() => parseStarsValue(searchParams.get(QUERY_STARS), DEFAULT_MIN_STARS))
  const [reviewScope, setReviewScope] = useState<ReviewScope>(() => parseReviewScope(searchParams.get(QUERY_SCOPE), DEFAULT_REVIEW_SCOPE))
  const [sortBy, setSortBy] = useState<SortKey>(() => parseSortKey(searchParams.get(QUERY_SORT), DEFAULT_SORT_BY))
  const [page, setPage] = useState(1)
  const [remoteMovies, setRemoteMovies] = useState<MovieWithStats[]>([])
  const [remoteTotal, setRemoteTotal] = useState(0)
  const [loadingRemote, setLoadingRemote] = useState(false)
  const [remoteLoaded, setRemoteLoaded] = useState(false)
  const [remoteFailed, setRemoteFailed] = useState(false)
  const [remoteReloadKey, setRemoteReloadKey] = useState(0)
  const [recentlyAddedMovieId, setRecentlyAddedMovieId] = useState<string | null>(null)
  const remoteRequestSeq = useRef(0)

  const resolvePosterUrl = (m: MovieDTO): string => {
    const candidate = m.posterUrl || (m.posterMediaId ? `/media/${m.posterMediaId}` : "")
    if (!candidate) return "https://placehold.co/480x720?text=Poster"
    if (candidate.startsWith("http://") || candidate.startsWith("https://")) return candidate
    return apiUrl(candidate)
  }

  const wantsAdd = searchParams.get("add") === "true"
  const showAddForm = wantsAdd && isAuthenticated
  const wantsReset = searchParams.get("reset") === "1"

  const closeAdd = () => {
    const next = new URLSearchParams(searchParams)
    next.delete("add")
    setSearchParams(next, { replace: true })
  }

  const resetFilters = useCallback(() => {
    setSearchQuery("")
    setMinStars(DEFAULT_MIN_STARS)
    setReviewScope(DEFAULT_REVIEW_SCOPE)
    setSortBy(DEFAULT_SORT_BY)
  }, [])

  useEffect(() => {
    if (!wantsReset) return
    resetFilters()
    const next = new URLSearchParams(searchParams)
    next.delete("reset")
    next.delete("add")
    setSearchParams(next, { replace: true })
  }, [wantsReset, resetFilters, searchParams, setSearchParams])

  useEffect(() => {
    if (wantsAdd && !isAuthenticated && !showLoginDialog) setShowLoginDialog(true)
  }, [wantsAdd, isAuthenticated, showLoginDialog])

  useEffect(() => {
    if (isAuthenticated) return
    if ((reviewScope === "mine" || reviewScope === "not_mine") && !showLoginDialog) {
      setShowLoginDialog(true)
    }
  }, [isAuthenticated, reviewScope, showLoginDialog])

  useEffect(() => {
    const next = new URLSearchParams()
    if (wantsAdd) next.set("add", "true")
    if (searchQuery) next.set(QUERY_Q, searchQuery); else next.delete(QUERY_Q)
    if (minStars !== DEFAULT_MIN_STARS) next.set(QUERY_STARS, minStars); else next.delete(QUERY_STARS)
    if (reviewScope !== DEFAULT_REVIEW_SCOPE) next.set(QUERY_SCOPE, reviewScope); else next.delete(QUERY_SCOPE)
    if (sortBy !== DEFAULT_SORT_BY) next.set(QUERY_SORT, sortBy); else next.delete(QUERY_SORT)
    setSearchParams(next, { replace: true })
    setPage((p) => p === 1 ? p : 1)
  }, [searchQuery, minStars, reviewScope, sortBy, wantsAdd, setSearchParams])

  const isRemote = Boolean(API_BASE)
  const effectiveReviewScope = useMemo(() => {
    if (!isAuthenticated && (reviewScope === "mine" || reviewScope === "not_mine")) return DEFAULT_REVIEW_SCOPE
    return reviewScope
  }, [isAuthenticated, reviewScope])

  const resultsWithReviewScope = useMemo(() => {
    if (isRemote) return []
    return queryMovies({
      search: searchQuery,
      minStars: Number(minStars),
      reviewScope: effectiveReviewScope,
      sortBy,
      userId: isAuthenticated ? user?.id : undefined,
    })
  }, [searchQuery, minStars, effectiveReviewScope, sortBy, user, queryMovies, isRemote, isAuthenticated])

  useEffect(() => {
    if (!API_BASE) return;
    const seq = ++remoteRequestSeq.current
    let active = true
    const run = async () => {
      if (page === 1) {
        setRemoteMovies([])
        setRemoteTotal(0)
        setRemoteLoaded(false)
        setRemoteFailed(false)
      }
      setLoadingRemote(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set("q", searchQuery)
        if (minStars !== DEFAULT_MIN_STARS) params.set("minStars", String(minStars))
        if (effectiveReviewScope !== DEFAULT_REVIEW_SCOPE) params.set("reviewScope", effectiveReviewScope)
        if (sortBy) params.set("sort", sortBy)
        params.set("page", String(page))
        const pageSize = 60
        params.set("pageSize", String(pageSize))
        const res = await moviesApi.listMovies(params)
        if (!active || seq !== remoteRequestSeq.current) return
        const mapped: MovieWithStats[] = res.data.items.map((m) => ({
          id: m.id,
          title: m.title,
          releaseDate: new Date(m.releaseDate).toISOString(),
          posterUrl: resolvePosterUrl(m),
          trailerUrl: "",
          synopsis: m.synopsis,
          createdBy: m.createdBy,
          createdAt: new Date(m.createdAt).toISOString(),
          reviewCount: m.reviewCount ?? 0,
          averageRating: m.averageRating ?? 0,
          rank: m.rank ?? 0,
        }))
        setRemoteMovies(prev => page === 1 ? mapped : [...prev, ...mapped.filter(n => !prev.some(p => p.id === n.id))])
        setRemoteTotal(res.data.total ?? mapped.length)
        setRemoteLoaded(true)
        setRemoteFailed(false)
      } catch {
        if (!active || seq !== remoteRequestSeq.current) return
        setRemoteMovies([])
        setRemoteTotal(0)
        setRemoteLoaded(true)
        setRemoteFailed(true)
      } finally {
        if (active && seq === remoteRequestSeq.current) {
          setLoadingRemote(false)
        }
      }
    }
    run()
    return () => { active = false }
  }, [searchQuery, minStars, effectiveReviewScope, sortBy, page, remoteReloadKey])

  useEffect(() => {
    if (!API_BASE || !recentlyAddedMovieId) return
    if (remoteMovies.some((m) => m.id === recentlyAddedMovieId)) {
      setRecentlyAddedMovieId(null)
    }
  }, [recentlyAddedMovieId, remoteMovies])

  useEffect(() => {
    if (!API_BASE || !recentlyAddedMovieId) return
    const intervalMs = 2000
    const maxMs = 15000
    const intervalId = window.setInterval(() => {
      setRemoteReloadKey((k) => k + 1)
    }, intervalMs)
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId)
      setRecentlyAddedMovieId(null)
    }, maxMs)
    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [recentlyAddedMovieId])

  const handleAddMovie = async (
    data: { title: string; releaseDate: string; posterUrl: string; trailerUrl: string; synopsis: string },
    posterFile?: File | null
  ) => {
    if (!user) {
      setShowLoginDialog(true)
      return
    }
    if (!API_BASE) {
      const success = addMovie({
        title: data.title,
        releaseDate: data.releaseDate,
        posterUrl: data.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500",
        trailerUrl: toEmbedUrl(data.trailerUrl || ""),
        synopsis: data.synopsis,
        createdBy: user.id,
      })
      if (success) {
        closeAdd()
        setFormError("")
        toast.success("Movie added")
      } else {
        setFormError("A movie with this title already exists.")
        toast.error("Movie already exists")
      }
      return
    }

    setFormError("")
    try {
      const created = await moviesApi.createMovie({
        title: data.title,
        releaseDate: new Date(data.releaseDate).toISOString(),
        synopsis: data.synopsis,
        ...(data.trailerUrl ? { trailerUrl: toEmbedUrl(data.trailerUrl) } : {}),
        ...(posterFile ? {} : data.posterUrl ? { posterUrl: data.posterUrl } : {}),
      })

      if (posterFile) {
        const upload = await mediaApi.upload(posterFile)
        await moviesApi.setPoster(created.data.id, upload.data.id)
      }

      setRecentlyAddedMovieId(created.data.id)
      closeAdd()
      setPage(1)
      setRemoteMovies([])
      setRemoteReloadKey((k) => k + 1)
      toast.success("Movie added")
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setShowLoginDialog(true)
        toast.error("Please log in to add a movie")
        return
      }
      if (e instanceof ApiError && e.status === 409) {
        setFormError("A movie with this title already exists.")
        toast.error("Movie already exists")
        return
      }
      toast.error("Failed to add movie")
    }
  }
  const moviesToShow = API_BASE ? remoteMovies : resultsWithReviewScope

  const sortLabel = useMemo(() => {
    return makeSortOptions(DEFAULT_LABELS_EN).find((o) => o.value === sortBy)?.label ?? "Top ranked"
  }, [sortBy])
  const canReset = searchQuery !== "" || minStars !== DEFAULT_MIN_STARS || reviewScope !== DEFAULT_REVIEW_SCOPE || sortBy !== DEFAULT_SORT_BY
  return (
    <div className="bg-background">
      <HeroSection />
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-5 lg:px-6 py-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <MoviesHeader count={moviesToShow.length} sortLabel={sortLabel} />
          <FiltersBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            minStars={minStars}
            onMinStars={setMinStars}
            reviewScope={reviewScope}
            onReviewScope={setReviewScope}
            sortBy={sortBy}
            onSortBy={setSortBy}
            onReset={resetFilters}
            canReset={canReset}
            isAuthenticated={isAuthenticated}
            onRequireLogin={() => setShowLoginDialog(true)}
          />
        </div>
        <MovieGrid
          key={`${searchQuery}-${minStars}-${reviewScope}-${sortBy}-${API_BASE ? "remote" : "local"}`}
          movies={moviesToShow}
          loading={loadingRemote}
          loaded={isRemote ? remoteLoaded : true}
          error={isRemote ? remoteFailed : false}
          hasMore={API_BASE ? remoteMovies.length < remoteTotal : undefined}
          onLoadMore={API_BASE ? (() => setPage((p) => p + 1)) : undefined}
        />
      </section>
      {showAddForm && (
        <MovieForm
          onSubmit={handleAddMovie}
          onClose={closeAdd}
          error={formError}
        />
      )}
      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={(open) => {
          setShowLoginDialog(open)
          if (!open && wantsAdd) closeAdd()
        }}
        message={wantsAdd ? "Please log in to add a new movie." : "Please log in to use this filter."}
      />
    </div>
  )
}

export default Index
