import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import HeroSection from "../components/HeroSection"
import SearchBar from "../components/SearchBar"
import { useMovies } from "../context/MovieContext"
import { MovieGrid } from "../components/movies/MovieGrid"
import { useAuth } from "../context/AuthContext"
import MovieForm from "../components/movies/MovieForm"
import LoginRequiredDialog from "../components/auth/LoginRequiredDialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

function Index() {
  const { rankedMovies, searchMovies, addMovie } = useMovies()
  const { user, isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [formError, setFormError] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [minStars, setMinStars] = useState<"0" | "1" | "2" | "3" | "4" | "5">("0")
  const [reviewScope, setReviewScope] = useState<"all" | "mine" | "not_mine">("all")
  const [sortBy, setSortBy] = useState<"reviews_desc" | "rating_desc" | "release_desc" | "release_asc" | "uploaded_desc">("reviews_desc")

  const wantsAdd = searchParams.get("add") === "true"
  const showAddForm = wantsAdd && isAuthenticated
  if (wantsAdd && !isAuthenticated && !showLoginDialog) {
    // prompt login then clear param
    setShowLoginDialog(true)
  }
  const results = useMemo(() => {
    const base = searchMovies(searchQuery)
    const min = Number(minStars)
    const filtered = min > 0 ? base.filter((m) => Math.round(m.averageRating) >= min) : base
    return filtered
  }, [searchQuery, searchMovies, minStars])

  const resultsWithReviewScope = useMemo(() => {
    if (reviewScope === "all" || !user) {
      // sort even when showing all
      const base = [...results]
      base.sort((a, b) => {
        switch (sortBy) {
          case "rating_desc":
            return b.averageRating - a.averageRating || b.reviewCount - a.reviewCount
          case "release_desc":
            return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
          case "release_asc":
            return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
          case "uploaded_desc":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case "reviews_desc":
          default:
            return b.reviewCount - a.reviewCount || b.averageRating - a.averageRating
        }
      })
      return base
    }
    const myId = user.id
    // Build a quick index of my reviewed movie IDs from localStorage data for speed
    const raw = localStorage.getItem("movieshelf:v1")
    let myReviewedIds = new Set<string>()
    try {
      if (raw) {
        const parsed = JSON.parse(raw) as { reviews: Array<{ movieId: string; userId: string }> }
        myReviewedIds = new Set(parsed.reviews.filter(r => r.userId === myId).map(r => r.movieId))
      }
    } catch {
      myReviewedIds = new Set<string>()
    }
    const scoped = reviewScope === "mine"
      ? results.filter(m => myReviewedIds.has(m.id))
      : results.filter(m => !myReviewedIds.has(m.id))
    const sorted = [...scoped]
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "rating_desc":
          return b.averageRating - a.averageRating || b.reviewCount - a.reviewCount
        case "release_desc":
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        case "release_asc":
          return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
        case "uploaded_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "reviews_desc":
        default:
          return b.reviewCount - a.reviewCount || b.averageRating - a.averageRating
      }
    })
    return sorted
  }, [results, reviewScope, user, sortBy])

  const handleAddMovie = (data: { title: string; releaseDate: string; posterUrl: string; trailerUrl: string; synopsis: string }) => {
    if (!user) return
    const success = addMovie({
      title: data.title,
      releaseDate: data.releaseDate,
      posterUrl: data.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500",
      trailerUrl: data.trailerUrl,
      synopsis: data.synopsis,
      createdBy: user.id,
    })
    if (success) {
      setSearchParams({})
      setFormError("")
    } else {
      setFormError("A movie with this title already exists.")
    }
  }

  return (
    <div className="bg-background">
      <HeroSection />
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-5 lg:px-6 py-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">All Movies</h2>
            <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
              {rankedMovies.length} movies · Ranked by review count
            </p>
          </div>
          <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Rating</span>
              <Select value={minStars} onValueChange={(v) => setMinStars(v as any)}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="5">5 stars</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="2">2+ stars</SelectItem>
                  <SelectItem value="1">1+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Sort</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviews_desc">Most reviews</SelectItem>
                  <SelectItem value="rating_desc">Highest rated</SelectItem>
                  <SelectItem value="release_desc">Newest release</SelectItem>
                  <SelectItem value="release_asc">Oldest release</SelectItem>
                  <SelectItem value="uploaded_desc">Recently added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Reviews</span>
              <Select
                value={reviewScope}
                onValueChange={(v) => {
                  if ((v === "mine" || v === "not_mine") && !isAuthenticated) {
                    setShowLoginDialog(true)
                    return
                  }
                  setReviewScope(v as any)
                }}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="mine">Reviewed by me</SelectItem>
                  <SelectItem value="not_mine">Not reviewed by me</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SearchBar onSearch={setSearchQuery} />
          </div>
        </div>
        <MovieGrid key={`${searchQuery}-${minStars}-${reviewScope}`} movies={resultsWithReviewScope} />
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
