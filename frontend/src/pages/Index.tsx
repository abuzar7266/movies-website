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
import type { Envelope, Paginated, MovieDTO } from "../types/api"
import { api, API_BASE, ApiError } from "../lib/api"

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
  const [remoteTotal, setRemoteTotal] = useState(0)
  const [loadingRemote, setLoadingRemote] = useState(false)
  const [remoteReloadKey, setRemoteReloadKey] = useState(0)

  const resolvePosterUrl = (m: MovieDTO): string => {
    const candidate = m.posterUrl || (m.posterMediaId ? `/media/${m.posterMediaId}` : "")
    if (!candidate) return "https://placehold.co/480x720?text=Poster"
    if (candidate.startsWith("http://") || candidate.startsWith("https://")) return candidate
    if (import.meta.env.DEV) return candidate
    return API_BASE ? new URL(candidate, API_BASE.endsWith("/") ? API_BASE : API_BASE + "/").toString() : candidate
  }

  const wantsAdd = searchParams.get("add") === "true"
  const showAddForm = wantsAdd && isAuthenticated

  const closeAdd = () => {
    const next = new URLSearchParams(searchParams)
    next.delete("add")
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    if (wantsAdd && !isAuthenticated && !showLoginDialog) setShowLoginDialog(true)
  }, [wantsAdd, isAuthenticated, showLoginDialog])

  useEffect(() => {
    const next = new URLSearchParams()
    if (wantsAdd) next.set("add", "true")
    if (searchQuery) next.set(QUERY_Q, searchQuery); else next.delete(QUERY_Q)
    if (minStars !== "0") next.set(QUERY_STARS, minStars); else next.delete(QUERY_STARS)
    if (reviewScope !== "all") next.set(QUERY_SCOPE, reviewScope); else next.delete(QUERY_SCOPE)
    if (sortBy !== "reviews_desc") next.set(QUERY_SORT, sortBy); else next.delete(QUERY_SORT)
    setSearchParams(next, { replace: true })
    setPage((p) => p === 1 ? p : 1)
  }, [searchQuery, minStars, reviewScope, sortBy, wantsAdd, setSearchParams])

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
        const pageSize = 60
        params.set("pageSize", String(pageSize))
        const res = await api.get<Envelope<Paginated<MovieDTO>>>(`/movies?${params.toString()}`)
        if (cancelled) return
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
      } catch {
        setRemoteMovies([])
        setRemoteTotal(0)
      } finally {
        setLoadingRemote(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [searchQuery, minStars, reviewScope, sortBy, page, remoteReloadKey])

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
      const created = await api.post<Envelope<MovieDTO>>("/movies", {
        title: data.title,
        releaseDate: new Date(data.releaseDate).toISOString(),
        synopsis: data.synopsis,
        ...(data.trailerUrl ? { trailerUrl: toEmbedUrl(data.trailerUrl) } : {}),
        ...(posterFile ? {} : data.posterUrl ? { posterUrl: data.posterUrl } : {}),
      })

      if (posterFile) {
        const form = new FormData()
        form.append("file", posterFile)
        const mediaUrl = import.meta.env.DEV
          ? "/media"
          : new URL("/media", API_BASE.endsWith("/") ? API_BASE : API_BASE + "/").toString()
        const upload = await fetch(mediaUrl, { method: "POST", body: form, credentials: "include" })
        if (upload.ok) {
          const uploadJson = (await upload.json()) as Envelope<{ id: string; url: string }>
          await api.patch(`/movies/${created.data.id}/poster`, { mediaId: uploadJson.data.id })
        }
      }

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
        <MovieGrid
          key={`${searchQuery}-${minStars}-${reviewScope}-${sortBy}-${API_BASE ? "remote" : "local"}`}
          movies={moviesToShow}
          loading={loadingRemote}
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
