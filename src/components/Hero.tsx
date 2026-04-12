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
    return <div className="h-[90vh] w-full bg-[#0B0F19]" />;
  }

  const overview = movie?.overview || "";
  const truncated = overview.length > 200 ? overview.substring(0, 200) + "..." : overview;
  
  // Create a stylized date/info string
  const year = movie.release_date ? movie.release_date.split('-')[0] : '2024';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '8.5';

  return (
    <header className="relative w-full min-h-[90vh] flex items-center pt-20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear scale-105 hover:scale-100"
          style={{
            backgroundImage: `url("${IMAGE_BASE}${movie.backdrop_path}")`,
          }}
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-[#0B0F19]/40 backdrop-blur-[2px]" />
      </div>

      {/* Floating Content Card Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-12">
        
        {/* Left Side: Info */}
        <div className="flex-1 text-left space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-panel text-sm font-medium text-blue-200">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            #1 Trending Today
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl">
            {movie.title || movie.name || movie.original_name}
          </h1>

          <div className="flex items-center gap-6 text-sm md:text-base text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{rating} Score</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            <span>{year}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            <span className="px-2 py-0.5 border border-slate-600 rounded text-xs font-bold tracking-wider">4K ULTRA HD</span>
          </div>

          <p className="text-base md:text-lg text-slate-300 max-w-xl leading-relaxed drop-shadow-md">
            {truncated}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="flex items-center gap-3 bg-gradient-primary text-white font-semibold px-8 py-4 rounded-2xl hover:scale-105 hover:shadow-[0_0_30px_-5px_#3B82F6] transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              Watch Trailer
            </button>
            <button
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="flex items-center gap-2 glass-panel text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add to List
            </button>
          </div>
        </div>

        {/* Right Side: Floating Poster (Optional, hides on small screens) */}
        <div className="hidden lg:block w-1/3 perspective-1000">
          <div className="relative transform rotate-y-[-15deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out">
            <img 
               src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
               alt={movie.title}
               className="w-full rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-2xl mix-blend-overlay"></div>
          </div>
        </div>

      </div>
    </header>
  );
}

export default Hero;