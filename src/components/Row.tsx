import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMoviesData } from "../services/movies";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

type Props = {
  title: string;
  fetchUrl: string;
  isLargeRow?: boolean;
};

function Row({ title, fetchUrl, isLargeRow = false }: Props) {
  const [movies, setMovies] = useState<any[]>([]);
  const navigate = useNavigate();
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchMoviesData(fetchUrl);
      setMovies(data || []);
    }
    fetchData();
  }, [fetchUrl]);

  const scroll = (direction: "left" | "right") => {
    if (!rowRef.current) return;
    const { clientWidth } = rowRef.current;
    const amount = direction === "left" ? -clientWidth * 0.7 : clientWidth * 0.7;
    rowRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (rowRef.current) {
      setScrollPos(rowRef.current.scrollLeft);
    }
  };

  if (!movies.length) return null;

  return (
    <div className="relative group/row">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-gradient-primary"></div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            {title}
          </h2>
        </div>
        <button className="text-sm font-semibold text-blue-400 hover:text-blue-300 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center gap-1">
          Explore All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="relative">
        {/* Left arrow */}
        {scrollPos > 0 && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full glass-panel flex items-center justify-center opacity-0 group-hover/row:opacity-100 hover:bg-white/10 hover:scale-110 transition-all duration-300 cursor-pointer text-white shadow-xl"
          >
            <svg className="w-6 h-6 ml-[-2px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex overflow-x-scroll hide-scrollbar gap-5 py-4 pl-2 pr-2"
        >
          {movies.map(
            (movie) =>
              ((isLargeRow && movie.poster_path) || (!isLargeRow && movie.backdrop_path)) && (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className={`shrink-0 cursor-pointer card-glow relative rounded-2xl overflow-hidden group ${
                    isLargeRow
                      ? "h-[280px] md:h-[350px] w-auto aspect-[2/3]"
                      : "h-[140px] md:h-[180px] w-auto aspect-[16/9]"
                  }`}
                >
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={`${IMAGE_BASE}${isLargeRow ? movie.poster_path : movie.backdrop_path}`}
                    alt={movie.title || movie.name}
                  />
                  
                  {/* Modern gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="font-bold text-sm md:text-base leading-tight truncate">{movie.title || movie.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-100">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-white text-xs font-semibold">{movie.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )
          )}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full glass-panel flex items-center justify-center opacity-0 group-hover/row:opacity-100 hover:bg-white/10 hover:scale-110 transition-all duration-300 cursor-pointer text-white shadow-xl"
        >
          <svg className="w-6 h-6 mr-[-2px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Row;
