import { useState } from "react"
import HeroSection from "../components/HeroSection"
import SearchBar from "../components/SearchBar"
import { useMovies } from "../context/MovieContext"
import { MovieGrid } from "../components/movies/MovieGrid"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { MovieForm } from "../components/movies/MovieForm"

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
        <div className="mb-4 flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Add Movie</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a New Movie</DialogTitle>
              </DialogHeader>
              <MovieForm />
            </DialogContent>
          </Dialog>
        </div>
        <MovieGrid movies={results} />
      </div>
    </div>
  )
}

export default Index
