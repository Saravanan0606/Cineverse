import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTrending } from "../hooks/useTrending";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

function TrendingRow() {
  const { data, isLoading } = useTrending();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="px-6 md:px-10 mb-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 bg-gradient-to-b from-rose-500 to-pink-600 rounded-full" />
          <h2 className="text-xl font-bold text-white">🔥 Trending This Week</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="glass border border-white/10 w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 hover:scale-110"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="glass border border-white/10 w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 hover:scale-110"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scroll row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-row pb-3"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-36 aspect-[2/3] skeleton rounded-xl"
                style={{ scrollSnapAlign: "start" }}
              />
            ))
          : data?.map((movie: any, i: number) => (
              <div
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="flex-shrink-0 w-36 group cursor-pointer relative"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Rank number */}
                <div className="absolute -left-3 bottom-4 z-10 text-6xl font-black text-white/20 select-none leading-none"
                  style={{ WebkitTextStroke: "2px rgba(255,255,255,0.15)" }}
                >
                  {i + 1}
                </div>

                <div className="relative rounded-xl overflow-hidden movie-card-glow transition-all duration-300 group-hover:-translate-y-1">
                  <img
                    src={`${IMAGE_BASE}${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                    <p className="text-xs font-semibold leading-tight line-clamp-2">{movie.title}</p>
                    <p className="text-[10px] text-yellow-400 mt-0.5">⭐ {movie.vote_average?.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}

export default TrendingRow;
