import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  query: string;
  onSearch: (q: string) => void;
};

function Navbar({ query, onSearch }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-12 h-16 transition-all duration-500 ${
        scrolled ? "bg-[#141414] shadow-lg" : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      {/* Left side */}
      <div className="flex items-center gap-6 lg:gap-10">
        <h1
          className="text-[#e50914] text-xl md:text-2xl font-extrabold cursor-pointer tracking-wider select-none"
          onClick={() => { onSearch(""); navigate("/"); }}
        >
          CINEVERSE
        </h1>

        <div className="hidden md:flex items-center gap-5 text-[14px] text-gray-300">
          <span className="text-white font-medium cursor-pointer hover:text-gray-300 transition">Home</span>
          <span className="cursor-pointer hover:text-white transition">TV Shows</span>
          <span className="cursor-pointer hover:text-white transition">Movies</span>
          <span className="cursor-pointer hover:text-white transition">New & Popular</span>
          <span className="cursor-pointer hover:text-white transition">My List</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search box */}
        <div
          className={`flex items-center transition-all duration-300 overflow-hidden ${
            searchOpen
              ? "w-52 md:w-64 bg-black/90 border border-white px-2"
              : "w-auto bg-transparent border-none"
          }`}
        >
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-white p-1 shrink-0"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          {searchOpen && (
            <input
              autoFocus
              className="bg-transparent text-white text-sm placeholder-gray-400 outline-none py-1.5 w-full ml-1"
              placeholder="Titles, people, genres"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
            />
          )}
        </div>

        <svg className="w-5 h-5 cursor-pointer text-white hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Avatar */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
          alt="avatar"
          className="w-8 h-8 rounded cursor-pointer"
        />
      </div>
    </nav>
  );
}

export default Navbar;
