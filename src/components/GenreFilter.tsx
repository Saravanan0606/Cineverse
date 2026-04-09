type Props = {
  selected: string;
  onSelect: (genre: string) => void;
};

const GENRES = [
  { id: "all",       label: "All",        icon: "🎬" },
  { id: "28",        label: "Action",     icon: "💥" },
  { id: "35",        label: "Comedy",     icon: "😂" },
  { id: "18",        label: "Drama",      icon: "🎭" },
  { id: "27",        label: "Horror",     icon: "👻" },
  { id: "878",       label: "Sci-Fi",     icon: "🚀" },
  { id: "10749",     label: "Romance",    icon: "❤️" },
  { id: "16",        label: "Animation",  icon: "✨" },
  { id: "53",        label: "Thriller",   icon: "🔪" },
  { id: "12",        label: "Adventure",  icon: "🌍" },
  { id: "14",        label: "Fantasy",    icon: "🧙" },
  { id: "80",        label: "Crime",      icon: "🕵️" },
];

function GenreFilter({ selected, onSelect }: Props) {
  return (
    <div className="px-6 md:px-10 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-7 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
        <h2 className="text-xl font-bold text-white">Browse by Genre</h2>
      </div>

      <div className="flex gap-2.5 overflow-x-auto scroll-row pb-2">
        {GENRES.map((genre) => {
          const isActive = selected === genre.id;
          return (
            <button
              key={genre.id}
              id={`genre-${genre.id}`}
              onClick={() => onSelect(genre.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 border hover:scale-105 active:scale-95 ${
                isActive
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 border-transparent text-white shadow-lg shadow-rose-500/30"
                  : "glass border-white/10 text-gray-400 hover:text-white hover:border-white/25 hover:bg-white/10"
              }`}
            >
              <span className="text-base leading-none">{genre.icon}</span>
              {genre.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GenreFilter;
export { GENRES };
