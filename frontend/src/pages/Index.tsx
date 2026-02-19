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

function Index() {
  const { addMovie, queryMovies } = useMovies()
  const { user, isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get(QUERY_Q) || "")
  const [formError, setFormError] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const defaultMinStars: StarsValue = "0"
  const defaultReviewScope: ReviewScope = "all"
  const defaultSortBy: SortKey = "rating_desc"
  const [minStars, setMinStars] = useState<StarsValue>((searchParams.get(QUERY_STARS) as StarsValue) || defaultMinStars)
  const [reviewScope, setReviewScope] = useState<ReviewScope>((searchParams.get(QUERY_SCOPE) as ReviewScope) || defaultReviewScope)
  const [sortBy, setSortBy] = useState<SortKey>((searchParams.get(QUERY_SORT) as SortKey) || defaultSortBy)
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
    setMinStars(defaultMinStars)
    setReviewScope(defaultReviewScope)
    setSortBy(defaultSortBy)
  }, [defaultMinStars, defaultReviewScope, defaultSortBy])

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
    const next = new URLSearchParams()
    if (wantsAdd) next.set("add", "true")
    if (searchQuery) next.set(QUERY_Q, searchQuery); else next.delete(QUERY_Q)
    if (minStars !== defaultMinStars) next.set(QUERY_STARS, minStars); else next.delete(QUERY_STARS)
    if (reviewScope !== defaultReviewScope) next.set(QUERY_SCOPE, reviewScope); else next.delete(QUERY_SCOPE)
    if (sortBy !== defaultSortBy) next.set(QUERY_SORT, sortBy); else next.delete(QUERY_SORT)
    setSearchParams(next, { replace: true })
    setPage((p) => p === 1 ? p : 1)
  }, [searchQuery, minStars, reviewScope, sortBy, wantsAdd, setSearchParams, defaultMinStars, defaultReviewScope, defaultSortBy])

  const isRemote = Boolean(API_BASE)

  const resultsWithReviewScope = useMemo(() => {
    if (isRemote) return []
    return queryMovies({
      search: searchQuery,
      minStars: Number(minStars),
      reviewScope,
      sortBy,
      userId: user?.id,
    })
  }, [searchQuery, minStars, reviewScope, sortBy, user, queryMovies, isRemote])

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
        if (minStars !== "0") params.set("minStars", String(minStars))
        if (reviewScope) params.set("reviewScope", reviewScope)
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
  }, [searchQuery, minStars, reviewScope, sortBy, page, remoteReloadKey])

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
    return makeSortOptions(DEFAULT_LABELS_EN).find((o) => o.value === sortBy)?.label ?? "Highest rated"
  }, [sortBy])
  const canReset = searchQuery !== "" || minStars !== defaultMinStars || reviewScope !== defaultReviewScope || sortBy !== defaultSortBy
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
