import { Film } from "lucide-react"

function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] py-8 mt-16">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center gap-2 px-4 sm:px-5 lg:px-6 text-center">
        <div className="flex items-center gap-2">
          <Film size={18} className="text-[hsl(var(--primary))]" />
          <span className="font-display text-sm font-semibold gold-text">MovieShelf</span>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Discover, review, and curate your movie collection.</p>
      </div>
    </footer>
  )
}

export default Footer
