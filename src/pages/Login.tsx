import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const response = await api.post("/auth/login", { email, password });
        localStorage.setItem("cineverse_token", response.data.token);
        localStorage.setItem("cineverse_user", JSON.stringify(response.data.user));
      } else {
        const response = await api.post("/auth/signup", { email, password, username });
        localStorage.setItem("cineverse_token", response.data.token);
        localStorage.setItem("cineverse_user", JSON.stringify(response.data.user));
      }
      navigate("/");
      // Force page reload so components like Navbar detect the new auth state
      window.location.reload();
    } catch (err: any) {
      console.error("Auth error", err);
      setError(err.response?.data?.error || "Authentication failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col relative overflow-hidden">
      
      {/* Background styling to match Home page */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full mix-blend-screen" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 w-full max-w-7xl mx-auto">
        <h1 
          className="text-3xl font-extrabold cursor-pointer tracking-wider"
          onClick={() => navigate("/")}
        >
          Cine<span className="text-gradient">Verse</span>
        </h1>
      </header>

      {/* Main Login Form */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-4">
        <div className="glass-panel p-10 md:p-14 rounded-3xl w-full max-w-md shadow-2xl">
          <h2 className="text-3xl font-bold mb-8 text-center">{isLogin ? "Welcome Back" : "Create Account"}</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm font-medium mb-6 text-center animate-in fade-in duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
             {!isLogin && (
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#0B0F19]/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                    placeholder="e.g. Cinephile99"
                  />
               </div>
             )}
             
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0F19]/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0F19]/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary text-white font-bold text-lg py-3.5 rounded-xl mt-2 hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#3B82F6] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                isLogin ? "Sign In" : "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-400 text-sm">
            {isLogin ? "New to CineVerse? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-white font-semibold hover:text-blue-400 transition-colors"
            >
              {isLogin ? "Sign up now." : "Sign in."}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
