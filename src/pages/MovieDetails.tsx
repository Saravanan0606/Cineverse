import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMovieDetails } from "../hooks/useMovieDetails";

const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";
const IMG_W500 = "https://image.tmdb.org/t/p/w500";
const IMG_W185 = "https://image.tmdb.org/t/p/w185";

function StarRating({ score }: { score: number }) {
  const stars = Math.round((score / 10) * 5);
  return (
    <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 w-max">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i < stars ? "text-yellow-400" : "text-slate-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-white font-bold ml-1">{score.toFixed(1)}</span>
    </div>
  );
}

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: movie, isLoading, isError } = useMovieDetails(id!);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    if (!movie) return;
    const stored = localStorage.getItem("cineverse_watchlist");
    if (stored) {
      const watchlist = JSON.parse(stored);
      setIsInWatchlist(watchlist.some((m: any) => m.id === movie.id));
    }
  }, [movie]);

  const toggleWatchlist = () => {
    if (!movie) return;
    const stored = localStorage.getItem("cineverse_watchlist");
    let watchlist = stored ? JSON.parse(stored) : [];
    
    if (isInWatchlist) {
      watchlist = watchlist.filter((m: any) => m.id !== movie.id);
      setIsInWatchlist(false);
    } else {
      const watchlistItem = {
        id: movie.id,
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        genres: movie.genres
      };
      watchlist.push(watchlistItem);
      setIsInWatchlist(true);
    }
    localStorage.setItem("cineverse_watchlist", JSON.stringify(watchlist));
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
        <div className="text-center glass-panel p-12 rounded-3xl">
          <p className="text-2xl font-bold mb-6">Movie not found</p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-primary text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const trailer = movie.videos?.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  ) ?? movie.videos?.[0];

  const cast = movie.credits?.cast?.slice(0, 12) ?? [];
  const director = movie.credits?.crew?.find((c: any) => c.job === "Director");
  
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const releaseYear = movie.release_date?.slice(0, 4);
  const similar = movie.similar?.filter((m: any) => m.poster_path).slice(0, 12) ?? [];

  let providerData = movie.watchProviders?.US || movie.watchProviders?.IN;
  if (!providerData && movie.watchProviders && Object.keys(movie.watchProviders).length > 0) {
    providerData = movie.watchProviders[Object.keys(movie.watchProviders)[0]];
  }
  const allProviders = [
    ...(providerData?.flatrate || []),
    ...(providerData?.rent || []),
    ...(providerData?.buy || [])
  ];
  const uniqueProviders = Array.from(new Map(allProviders.map((p: any) => [p.provider_id, p])).values());

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white overflow-hidden pb-20">

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 flex items-center justify-center w-12 h-12 glass-panel rounded-full hover:bg-white/10 hover:scale-110 transition-all text-white shadow-xl"
      >
        <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ── Hero Backdrop ── */}
      <div className="relative h-[60vh] lg:h-[75vh] w-full">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMG_ORIGINAL}${movie.backdrop_path || movie.poster_path})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19]/90 via-[#0B0F19]/40 to-transparent" />
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-40 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* Poster */}
          <div className="shrink-0 group perspective-1000 hidden md:block">
            <img
              src={`${IMG_W500}${movie.poster_path}`}
              alt={movie.title}
              className="w-64 lg:w-80 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transform transition-transform duration-500 group-hover:rotate-y-6 group-hover:-translate-y-2"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6 lg:pt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 font-semibold text-sm border border-blue-500/30">
               {movie.status}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-medium italic">
                "{movie.tagline}"
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-slate-300 font-medium">
              {releaseYear && <span className="text-white bg-white/10 px-3 py-1 rounded-md">{releaseYear}</span>}
              {runtime && <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{runtime}</span>}
              {movie.original_language && <span className="uppercase text-slate-400">{movie.original_language}</span>}
            </div>

            <StarRating score={movie.vote_average ?? 0} />

            {/* Genres */}
            <div className="flex flex-wrap gap-3">
              {movie.genres?.map((g: any) => (
                <span key={g.id} className="text-sm font-medium glass-panel px-4 py-1.5 rounded-full text-slate-200">
                  {g.name}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              {trailer && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-3 bg-gradient-primary text-white font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_-5px_#3B82F6] hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Watch Trailer
                </button>
              )}
              <button 
                onClick={toggleWatchlist}
                className={`flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 ${
                  isInWatchlist 
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30 hover:scale-105" 
                    : "glass-panel text-white hover:bg-white/10 hover:scale-105"
                }`}
                title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              >
                {isInWatchlist ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
              <button className="flex items-center justify-center w-14 h-14 rounded-xl glass-panel hover:bg-white/10 hover:scale-105 transition-all">
                <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>
            </div>

            {/* Overview */}
            <div className="pt-6">
              <h3 className="text-xl font-bold mb-3 text-white">Storyline</h3>
              <p className="text-slate-300 leading-relaxed text-lg max-w-3xl">
                {movie.overview}
              </p>
            </div>
            
            {/* Watch Providers */}
            {uniqueProviders.length > 0 && (
              <div className="pt-6 mt-2 border-t border-white/5">
                <h3 className="text-xl font-bold mb-4 text-white">Where to Watch</h3>
                <div className="flex flex-wrap gap-4">
                  {uniqueProviders.map((provider: any) => (
                    <div key={provider.provider_id} className="relative group/provider w-14 h-14 rounded-2xl overflow-visible hover:scale-110 transition-all z-20">
                      <div className="w-full h-full rounded-2xl overflow-hidden glass-panel border border-white/5 hover:border-white/20 hover:shadow-[0_0_20px_-5px_#3B82F6] bg-[#0B0F19]">
                         <img src={`${IMG_ORIGINAL}${provider.logo_path}`} alt={provider.provider_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover/provider:opacity-100 transition-opacity whitespace-nowrap pointer-events-none drop-shadow-md border border-white/10">
                        {provider.provider_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Director */}
            {director && (
              <div className="pt-4 flex items-center gap-3">
                 <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 </div>
                 <div>
                    <p className="text-sm text-slate-400 font-medium">Director</p>
                    <p className="text-white font-bold">{director.name}</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Cast ── */}
        {cast.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 rounded-full bg-blue-500"></div>
              <h2 className="text-2xl font-bold">Top Cast</h2>
            </div>
            <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6">
              {cast.map((person: any) => (
                <div key={person.cast_id ?? person.id} className="shrink-0 w-32 group cursor-pointer">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/5 mb-4 group-hover:-translate-y-2 group-hover:shadow-[0_10px_20px_-10px_#3B82F6] transition-all duration-300">
                    {person.profile_path ? (
                      <img src={`${IMG_W185}${person.profile_path}`} alt={person.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white truncate">{person.name}</p>
                  <p className="text-xs text-slate-400 mt-1 truncate">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Similar Movies ── */}
        {similar.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 rounded-full bg-purple-500"></div>
              <h2 className="text-2xl font-bold">You Might Also Like</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similar.map((m: any) => (
                <div key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="group cursor-pointer card-glow relative rounded-2xl overflow-hidden">
                  <img src={`${IMG_W500}${m.poster_path}`} alt={m.title ?? m.name} className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="font-bold text-sm leading-tight truncate">{m.title}</p>
                    <p className="text-yellow-400 text-xs font-semibold mt-1">⭐ {m.vote_average?.toFixed(1)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Trailer Modal ── */}
      {showTrailer && trailer && (
        <div className="fixed inset-0 z-[100] bg-[#0B0F19]/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300" onClick={() => setShowTrailer(false)}>
          <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-[0_0_50px_-10px_rgba(59,130,246,0.3)] ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTrailer(false)} className="absolute z-10 top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen title="Trailer" />
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetails;