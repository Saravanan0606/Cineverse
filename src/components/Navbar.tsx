import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type Props = {
  query: string;
  onSearch: (q: string) => void;
};

function Navbar({ query, onSearch }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-20 transition-all duration-300 ${
        scrolled ? "glass-nav" : "bg-transparent"
      }`}
    >
      {/* Left side */}
      <div className="flex items-center gap-8 lg:gap-12">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => { onSearch(""); navigate("/"); }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-wide">
            Cine<span className="text-gradient">Verse</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[15px] font-medium">
          <span 
            className={`cursor-pointer transition-colors ${currentPath === '/' ? 'text-white relative after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-blue-500' : 'text-slate-300 hover:text-white'}`} 
            onClick={() => navigate('/')}
          >
            Home
          </span>
          <span 
            className={`cursor-pointer transition-colors ${currentPath === '/discover' ? 'text-white relative after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-blue-500' : 'text-slate-300 hover:text-white'}`} 
            onClick={() => navigate('/discover')}
          >
            Discover
          </span>
          <span 
            className={`cursor-pointer transition-colors ${currentPath === '/movies' ? 'text-white relative after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-blue-500' : 'text-slate-300 hover:text-white'}`} 
            onClick={() => navigate('/movies')}
          >
            Movies
          </span>
          <span 
            className={`cursor-pointer transition-colors ${currentPath === '/series' ? 'text-white relative after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-blue-500' : 'text-slate-300 hover:text-white'}`} 
            onClick={() => navigate('/series')}
          >
            Series
          </span>
          <span 
            className={`cursor-pointer transition-colors ${currentPath === '/watchlist' ? 'text-white relative after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-blue-500' : 'text-slate-300 hover:text-white'}`} 
            onClick={() => navigate('/watchlist')}
          >
            Watchlist
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        {/* Modern Search */}
        <div
          className={`flex items-center transition-all duration-300 overflow-hidden rounded-full ${
            searchOpen || query
              ? "w-64 bg-white/5 border border-white/10 px-4 h-10"
              : "w-10 h-10 bg-white/5 hover:bg-white/10 border border-transparent justify-center cursor-pointer"
          }`}
          onClick={() => !searchOpen && setSearchOpen(true)}
        >
          <svg className={`w-5 h-5 ${searchOpen || query ? "text-blue-400" : "text-white"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          
          {(searchOpen || query) && (
            <input
              autoFocus={searchOpen}
              className="bg-transparent text-white text-sm placeholder-slate-400 outline-none w-full ml-3"
              placeholder="Search movies..."
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              onBlur={() => !query && setSearchOpen(false)}
            />
          )}
        </div>

        <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors relative">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-gradient-primary p-[2px] cursor-pointer hover:scale-105 transition-transform"
        >
           <img
             src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4"
             alt="avatar"
             className="w-full h-full rounded-full object-cover bg-[#0B0F19]"
           />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
