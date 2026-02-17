import { useState } from "react"
import HeroSection from "../components/HeroSection"
import SearchBar from "../components/SearchBar"
import RankBadge from "../components/RankBadge"
import StarRating from "../components/StarRating"
import { useMovies } from "../context/MovieContext"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Link } from "react-router-dom"

function Index() {
  const { searchMovies } = useMovies()
  const [query, setQuery] = useState("")
  const results = searchMovies(query).slice(0, 12)

  return (
    <div className="space-y-8">
      <HeroSection />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Top Movies</h2>
          <SearchBar onSearch={setQuery} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {results.map((m) => (
            <Link key={m.id} to={`/movie/${m.id}`}>
              <Card className="relative overflow-hidden">
                <RankBadge rank={m.rank} />
                <img src={m.posterUrl} alt={m.title} className="h-64 w-full object-cover" />
                <CardHeader>
                  <CardTitle className="text-base">{m.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0">
                  <span className="text-xs text-gray-500">{new Date(m.releaseDate).getFullYear()}</span>
                  <StarRating rating={Math.round(m.averageRating)} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Index
