import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  movie: any;
  index?: number;
};

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function MovieCard({ movie, index = 0 }: Props) {
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const rating = movie.vote_average?.toFixed(1);
  const ratingColor =
    movie.vote_average >= 7.5
      ? "text-green-400"
      : movie.vote_average >= 6
      ? "text-yellow-400"
      : "text-red-400";

  const year = movie.release_date?.split("-")[0] ?? "";

  return (
    <div
      id={`movie-card-${movie.id}`}
      onClick={() => navigate(`/movie/${movie.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer rounded-2xl overflow-hidden movie-card-glow transition-all duration-300 hover:-translate-y-2"
      style={{
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Skeleton */}
      {!imgLoaded && (
        <div className="w-full aspect-[2/3] skeleton rounded-2xl" />
      )}

      {/* Poster */}
      <img
        src={`${IMAGE_BASE}${movie.poster_path}`}
        alt={movie.title}
        onLoad={() => setImgLoaded(true)}
        className={`w-full aspect-[2/3] object-cover rounded-2xl transition-all duration-500 ${
          imgLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
        } ${isHovered ? "scale-105" : "scale-100"}`}
      />

      {/* Top badges */}
      <div className="absolute top-2 left-2 z-10">
        {year && (
          <span className="bg-black/60 backdrop-blur text-gray-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10">
            {year}
          </span>
        )}
      </div>

      {/* Rating badge top-right */}
      <div className="absolute top-2 right-2 z-10">
        <span
          className={`flex items-center gap-0.5 bg-black/70 backdrop-blur text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/10 ${ratingColor}`}
        >
          ★ {rating}
        </span>
      </div>

      {/* Hover Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent rounded-2xl flex flex-col justify-end p-3 transition-all duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="text-sm font-bold leading-tight line-clamp-2 mb-1">
          {movie.title}
        </h2>

        {/* Mini rating bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${(movie.vote_average / 10) * 100}%` }}
            />
          </div>
          <span className={`text-[10px] font-bold ${ratingColor}`}>{rating}</span>
        </div>

        <button className="w-full flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          View Details
        </button>
      </div>
    </div>
  );
}

export default MovieCard;