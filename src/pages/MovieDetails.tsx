import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMovieDetails } from "../hooks/useMovieDetails";

const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";
const IMG_W500 = "https://image.tmdb.org/t/p/w500";
const IMG_W185 = "https://image.tmdb.org/t/p/w185";

function StarRating({ score }: { score: number }) {
  const stars = Math.round((score / 10) * 5);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < stars ? "text-[#e50914]" : "text-gray-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-gray-400 text-sm ml-1">{score.toFixed(1)}/10</span>
    </div>
  );
}

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: movie, isLoading, isError } = useMovieDetails(id!);
  const [showTrailer, setShowTrailer] = useState(false);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Movie not found</p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#e50914] text-white px-6 py-2 rounded hover:bg-[#b20710] transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Data helpers
  const trailer = movie.videos?.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  ) ?? movie.videos?.[0];

  const cast = movie.credits?.cast?.slice(0, 12) ?? [];
  const director = movie.credits?.crew?.find((c: any) => c.job === "Director");
  const writers = movie.credits?.crew
    ?.filter((c: any) => c.job === "Screenplay" || c.job === "Writer")
    .slice(0, 3) ?? [];

  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;
  const releaseYear = movie.release_date?.slice(0, 4);
  const similar = movie.similar?.filter((m: any) => m.poster_path).slice(0, 12) ?? [];

  return (
    <div className="min-h-screen bg-[#141414] text-white">

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-black/60 hover:bg-black/90 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-full transition-all border border-white/10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* ── Hero Backdrop ── */}
      <div className="relative h-[55vh] md:h-[70vh] w-full overflow-hidden">
        <img
          src={`${IMG_ORIGINAL}${movie.backdrop_path || movie.poster_path}`}
          alt={movie.title}
          className="w-full h-full object-cover object-center"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 via-transparent to-transparent" />

        {/* Play trailer button overlay */}
        {trailer && (
          <button
            onClick={() => setShowTrailer(true)}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/60 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 md:w-9 md:h-9 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Poster */}
          <div className="shrink-0">
            <img
              src={`${IMG_W500}${movie.poster_path}`}
              alt={movie.title}
              className="w-36 md:w-52 lg:w-64 rounded-md shadow-2xl shadow-black/80 ring-1 ring-white/10"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 md:pt-10">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {movie.title}
            </h1>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-gray-400 italic mt-2 text-base md:text-lg">
                "{movie.tagline}"
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-gray-400">
              {releaseYear && <span className="text-green-500 font-semibold text-base">{releaseYear}</span>}
              {runtime && <span>{runtime}</span>}
              {movie.adult === false && (
                <span className="border border-gray-500 px-1.5 py-0.5 text-xs">PG</span>
              )}
              {movie.original_language && (
                <span className="uppercase border border-gray-600 px-1.5 py-0.5 text-xs">
                  {movie.original_language}
                </span>
              )}
              {movie.vote_count > 0 && (
                <span className="text-gray-500">{movie.vote_count.toLocaleString()} votes</span>
              )}
            </div>

            {/* Star rating */}
            <div className="mt-3">
              <StarRating score={movie.vote_average ?? 0} />
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mt-4">
              {movie.genres?.map((g: any) => (
                <span
                  key={g.id}
                  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/10 cursor-default transition"
                >
                  {g.name}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {trailer && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded hover:bg-gray-200 transition text-sm md:text-base"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play Trailer
                </button>
              )}
              <button className="flex items-center gap-2 bg-gray-600/60 hover:bg-gray-600/40 text-white font-bold px-6 py-2.5 rounded transition text-sm md:text-base border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                My List
              </button>
              <button className="flex items-center gap-2 bg-gray-600/60 hover:bg-gray-600/40 text-white font-bold px-6 py-2.5 rounded transition text-sm md:text-base border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                Like
              </button>
            </div>

            {/* Overview */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Overview</h3>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                {movie.overview}
              </p>
            </div>

            {/* Crew info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 text-sm">
              {director && (
                <div>
                  <p className="text-white font-semibold">{director.name}</p>
                  <p className="text-gray-500">Director</p>
                </div>
              )}
              {writers.map((w: any) => (
                <div key={w.id}>
                  <p className="text-white font-semibold">{w.name}</p>
                  <p className="text-gray-500">Writer</p>
                </div>
              ))}
              {movie.budget > 0 && (
                <div>
                  <p className="text-white font-semibold">${(movie.budget / 1_000_000).toFixed(0)}M</p>
                  <p className="text-gray-500">Budget</p>
                </div>
              )}
              {movie.revenue > 0 && (
                <div>
                  <p className="text-white font-semibold">${(movie.revenue / 1_000_000).toFixed(0)}M</p>
                  <p className="text-gray-500">Revenue</p>
                </div>
              )}
              {movie.status && (
                <div>
                  <p className="text-white font-semibold">{movie.status}</p>
                  <p className="text-gray-500">Status</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Cast ── */}
        {cast.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold mb-4">Cast</h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3">
              {cast.map((person: any) => (
                <div key={person.cast_id ?? person.id} className="shrink-0 w-24 md:w-28 text-center group cursor-pointer">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-800 mb-2 ring-2 ring-transparent group-hover:ring-[#e50914] transition-all duration-300">
                    {person.profile_path ? (
                      <img
                        src={`${IMG_W185}${person.profile_path}`}
                        alt={person.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight">{person.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Production Companies ── */}
        {movie.production_companies?.filter((c: any) => c.logo_path).length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold mb-5">Production</h2>
            <div className="flex flex-wrap gap-6 items-center">
              {movie.production_companies
                .filter((c: any) => c.logo_path)
                .map((company: any) => (
                  <div
                    key={company.id}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-5 py-3 flex items-center gap-3 transition cursor-default"
                  >
                    <img
                      src={`${IMG_W185}${company.logo_path}`}
                      alt={company.name}
                      className="h-7 object-contain brightness-0 invert opacity-70"
                    />
                    <span className="text-xs text-gray-400">{company.name}</span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* ── Similar Movies ── */}
        {similar.length > 0 && (
          <section className="mt-14 mb-16">
            <h2 className="text-xl font-bold mb-4">More Like This</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
              {similar.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/movie/${m.id}`)}
                  className="group cursor-pointer relative"
                >
                  <img
                    src={`${IMG_W500}${m.poster_path}`}
                    alt={m.title ?? m.name}
                    className="w-full aspect-[2/3] object-cover rounded-[4px] group-hover:opacity-80 transition-all duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-[4px] flex items-end opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                    <div>
                      <p className="text-xs font-semibold leading-tight line-clamp-2">{m.title}</p>
                      <p className="text-xs text-yellow-400 mt-0.5">⭐ {m.vote_average?.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Trailer Modal ── */}
      {showTrailer && trailer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition text-sm flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Trailer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetails;