import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Row from "../components/Row";
import { requests, searchMovies } from "../services/movies";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

function Home() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchMovies(query).then(setSearchResults);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen text-white">
      <Navbar query={query} onSearch={setQuery} />

      {query.trim() ? (
        /* ── Search Results ── */
        <div className="pt-32 pb-16 px-6 md:px-12 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 rounded-full bg-blue-500"></div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Results for "{query}"
            </h2>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 mt-10">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg">No movies found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {searchResults.map(
                (movie) =>
                  movie.poster_path && (
                    <div
                      key={movie.id}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="group cursor-pointer card-glow relative rounded-2xl overflow-hidden"
                    >
                      <img
                        className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-110"
                        src={`${IMAGE_BASE}${movie.poster_path}`}
                        alt={movie.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h4 className="font-bold text-sm line-clamp-2 leading-tight">{movie.title}</h4>
                        <div className="flex items-center gap-1 mt-1 text-yellow-400 text-xs font-medium">
                          <span>⭐</span> {movie.vote_average?.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Main Home ── */
        <div className="pb-20">
          <Hero />

          <div className="relative z-20 max-w-[1600px] mx-auto px-4 md:px-12 space-y-12 md:space-y-16 -mt-10 md:mt-12">
            <Row
              title="Trending Now"
              fetchUrl={requests.fetchTrending}
              isLargeRow
            />
            <Row
              title="Top Rated Picks"
              fetchUrl={requests.fetchTopRated}
            />
            <Row
              title="CineVerse Exclusives"
              fetchUrl={requests.fetchNetflixOriginals}
            />
            <Row
              title="Action Packed"
              fetchUrl={requests.fetchActionMovies}
            />
            <Row
              title="Laugh Out Loud"
              fetchUrl={requests.fetchComedyMovies}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;