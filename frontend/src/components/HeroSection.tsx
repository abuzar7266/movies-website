import { Sparkles } from "lucide-react";

const HeroSection = () => (
  <section className="hero-gradient relative overflow-hidden py-16 sm:py-24">
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-5 lg:px-6 relative z-10 text-center">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 mb-6">
        <Sparkles size={13} className="text-[hsl(var(--primary))]" />
        <span className="text-xs font-medium text-[hsl(var(--primary))]">Ranked by community reviews</span>
      </div>
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
        Discover & Review<br />
        <span className="gold-text">Great Cinema</span>
      </h1>
      <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-base sm:text-lg">
        Explore a curated collection of movies, watch trailers, and share your reviews with the community.
      </p>
    </div>
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
  </section>
);

export default HeroSection;
