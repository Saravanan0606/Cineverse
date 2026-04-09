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
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar query={query} onSearch={setQuery} />

      {query.trim() ? (
        /* ── Search Results ── */
        <div className="pt-24 pb-16 px-4 md:px-[60px]">
          <h2 className="text-lg text-gray-400 mb-6">
            Results for <span className="text-white font-semibold">"{query}"</span>
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-gray-500 mt-10 text-center">No results found.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
              {searchResults.map(
                (movie) =>
                  movie.poster_path && (
                    <img
                      key={movie.id}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="w-full aspect-[2/3] object-cover cursor-pointer rounded-[4px] hover:scale-105 transition-transform duration-200 hover:z-10 relative"
                      src={`${IMAGE_BASE}${movie.poster_path}`}
                      alt={movie.title}
                    />
                  )
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Main Home ── */
        <div>
          {/* Hero billboard */}
          <Hero />

          {/* Rows — pulled up to overlap hero bottom fade */}
          <div className="relative z-10 -mt-[80px] md:-mt-[120px] pb-16 space-y-2 md:space-y-4">
            <Row
              title="Trending Now"
              fetchUrl={requests.fetchTrending}
            />
            <Row
              title="Top Rated"
              fetchUrl={requests.fetchTopRated}
            />
            <Row
              title="CineVerse Originals"
              fetchUrl={requests.fetchNetflixOriginals}
              isLargeRow
            />
            <Row
              title="Action Movies"
              fetchUrl={requests.fetchActionMovies}
            />
            <Row
              title="Comedy Movies"
              fetchUrl={requests.fetchComedyMovies}
            />
            <Row
              title="Horror Movies"
              fetchUrl={requests.fetchHorrorMovies}
            />
            <Row
              title="Romance Movies"
              fetchUrl={requests.fetchRomanceMovies}
            />
            <Row
              title="Documentaries"
              fetchUrl={requests.fetchDocumentaries}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;