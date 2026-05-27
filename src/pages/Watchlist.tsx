import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

function Watchlist() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>("added"); // 'added' | 'rating' | 'title'
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("cineverse_watchlist");
    if (stored) {
      setWatchlist(JSON.parse(stored));
    }
  }, []);

  const handleRemove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid navigating to movie details page
    const updated = watchlist.filter((m) => m.id !== id);
    setWatchlist(updated);
    localStorage.setItem("cineverse_watchlist", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your entire watchlist?")) {
      setWatchlist([]);
      localStorage.removeItem("cineverse_watchlist");
    }
  };

  const getSortedWatchlist = () => {
    const listCopy = [...watchlist];
    if (sortBy === "rating") {
      return listCopy.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    }
    if (sortBy === "title") {
      return listCopy.sort((a, b) => {
        const titleA = a.title || a.name || "";
        const titleB = b.title || b.name || "";
        return titleA.localeCompare(titleB);
      });
    }
    // 'added' maintains storage array order (reversed to show newest first)
    return listCopy.reverse();
  };

  const sortedWatchlist = getSortedWatchlist();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <Navbar query="" onSearch={() => {}} />

      <main className="pt-32 pb-16 px-6 md:px-12 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">My Watchlist</h1>
              <p className="text-sm text-slate-400 mt-1">
                {watchlist.length === 0 
                  ? "No movies saved yet" 
                  : `You have ${watchlist.length} ${watchlist.length === 1 ? 'movie' : 'movies'} saved`}
              </p>
            </div>
          </div>

          {watchlist.length > 0 && (
            <div className="flex items-center gap-4 self-end sm:self-auto">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#1E293B]/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition-all font-sans cursor-pointer"
                >
                  <option value="added">Recently Added</option>
                  <option value="rating">Top Rated</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>

              {/* Clear All */}
              <button
                onClick={handleClearAll}
                className="px-4 py-2 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold bg-red-500/5 hover:bg-red-500/15 transition-all hover:scale-105 duration-300"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        {sortedWatchlist.length === 0 ? (
          /* Empty State */
          <div className="glass-panel rounded-3xl p-12 md:p-20 text-center max-w-2xl mx-auto mt-12 shadow-2xl relative overflow-hidden">
            {/* Background glowing blobs */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 shadow-inner">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">Your Watchlist is Empty</h3>
            <p className="text-slate-400 text-base max-w-md mx-auto mb-8 leading-relaxed">
              Explore thousands of movies, keep track of what you want to watch, and build your ultimate cinephile catalog.
            </p>
            
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-primary text-white font-bold px-8 py-3.5 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              Explore Movies
            </button>
          </div>
        ) : (
          /* Movie Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
            {sortedWatchlist.map((movie) => (
              <div
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="group cursor-pointer card-glow relative rounded-2xl overflow-hidden bg-white/5 border border-white/5"
              >
                {/* Remove button floating on hover */}
                <button
                  onClick={(e) => handleRemove(movie.id, e)}
                  className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-md transform hover:scale-110"
                  title="Remove from Watchlist"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {movie.poster_path ? (
                  <img
                    className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-110"
                    src={`${IMAGE_BASE}${movie.poster_path}`}
                    alt={movie.title}
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-slate-800 flex items-center justify-center text-slate-500 text-center p-4">
                    <span className="font-bold text-sm">{movie.title}</span>
                  </div>
                )}
                
                {/* Overlay gradient & title */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20">
                  <h4 className="font-bold text-sm line-clamp-2 leading-tight text-white">{movie.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-1 text-yellow-400 text-xs font-semibold">
                      ⭐ {movie.vote_average?.toFixed(1) || "N/A"}
                    </span>
                    {movie.release_date && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {movie.release_date.slice(0, 4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Watchlist;
