import { Sparkles } from "lucide-react";

const HeroSection = () => (
  <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-950">
    <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
      <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 dark:border-indigo-800/50 dark:bg-indigo-900/30">
        <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
        <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Ranked by community reviews</span>
      </div>
      <h1 className="font-semibold leading-tight text-4xl sm:text-5xl lg:text-6xl">
        Discover & Review<br />
        <span className="text-indigo-600 dark:text-indigo-400">Great Cinema</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-gray-600 sm:text-lg dark:text-gray-300">
        Explore a curated collection of movies, watch trailers, and share your reviews with the community.
      </p>
    </div>
    <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-800/30" />
  </section>
);

export default HeroSection;
