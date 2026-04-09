import { useState, useEffect } from "react";
import { fetchMoviesData, requests } from "../services/movies";
import { useNavigate } from "react-router-dom";

const IMAGE_BASE = "https://image.tmdb.org/t/p/original";

function Hero() {
  const [movie, setMovie] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      const data = await fetchMoviesData(requests.fetchTrending);
      if (data && data.length > 0) {
        setMovie(data[Math.floor(Math.random() * data.length)]);
      }
    }
    fetchData();
  }, []);

  if (!movie) {
    return <div className="h-[80vh] w-full bg-[#141414]" />;
  }

  const overview = movie?.overview || "";
  const truncated = overview.length > 180 ? overview.substring(0, 180) + "..." : overview;

  return (
    <header className="relative h-[80vh] w-full">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${IMAGE_BASE}${movie.backdrop_path}")`,
        }}
      />

      {/* Dark overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

      {/* Top fade for navbar blend */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col justify-end h-full pb-[15%] md:pb-[12%] pl-6 md:pl-12 pr-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold max-w-2xl leading-tight">
          {movie.title || movie.name || movie.original_name}
        </h1>

        <p className="text-sm md:text-base text-gray-300 max-w-lg mt-4 leading-relaxed">
          {truncated}
        </p>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="flex items-center gap-2 bg-white text-black font-bold text-sm md:text-base px-5 md:px-7 py-2 md:py-2.5 rounded hover:bg-gray-300 transition-colors"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
          <button
            onClick={() => navigate(`/movie/${movie.id}`)}
            className="flex items-center gap-2 bg-gray-500/70 text-white font-bold text-sm md:text-base px-5 md:px-7 py-2 md:py-2.5 rounded hover:bg-gray-500/40 transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            More Info
          </button>
        </div>
      </div>

      {/* Bottom fade to blend into rows */}
      <div className="absolute bottom-0 left-0 right-0 banner-fade-bottom z-10" />
    </header>
  );
}

export default Hero;