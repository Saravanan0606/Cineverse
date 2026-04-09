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
    const amount = direction === "left" ? -clientWidth * 0.8 : clientWidth * 0.8;
    rowRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (rowRef.current) {
      setScrollPos(rowRef.current.scrollLeft);
    }
  };

  if (!movies.length) return null;

  return (
    <div className="mb-6 md:mb-8 relative group/row">
      {/* Section title */}
      <h2 className="text-base md:text-xl font-bold mb-1 md:mb-2 pl-4 md:pl-[60px] text-white hover:text-gray-300 cursor-pointer transition-colors">
        {title}
        <span className="text-[#54b9c5] text-xs font-medium ml-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
          Explore All &rsaquo;
        </span>
      </h2>

      {/* Left arrow */}
      {scrollPos > 0 && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-8 bottom-0 z-40 w-10 md:w-[60px] bg-black/50 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Movie posters */}
      <div
        ref={rowRef}
        onScroll={handleScroll}
        className="flex overflow-x-scroll hide-scrollbar gap-[6px] pl-4 md:pl-[60px] pr-4 md:pr-[60px] py-4"
      >
        {movies.map(
          (movie) =>
            ((isLargeRow && movie.poster_path) ||
              (!isLargeRow && movie.backdrop_path)) && (
              <img
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className={`shrink-0 cursor-pointer object-cover rounded-[4px] transition-transform duration-200 hover:scale-110 hover:z-30 ${
                  isLargeRow
                    ? "h-[200px] md:h-[300px] w-auto"
                    : "h-[100px] md:h-[140px] w-[180px] md:w-[245px]"
                }`}
                src={`${IMAGE_BASE}${isLargeRow ? movie.poster_path : movie.backdrop_path}`}
                alt={movie.name || movie.title}
              />
            )
        )}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-8 bottom-0 z-40 w-10 md:w-[60px] bg-black/50 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-200 cursor-pointer"
      >
        <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export default Row;
