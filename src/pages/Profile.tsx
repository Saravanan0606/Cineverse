import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../utils/api";

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("cineverse_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get("/user/profile");
        const data = response.data;
        setUsername(data.username);
        setEmail(data.email);
        setFullName(data.full_name || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}&backgroundColor=b6e3f4`);
      } catch (err: any) {
        console.error("Error fetching profile", err);
        setError("Failed to load profile details. Please try signing in again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await api.post("/user/profile/update", {
        username,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl
      });
      setSuccess("Profile updated successfully!");
      const storedUser = localStorage.getItem("cineverse_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.username = username;
        parsed.full_name = fullName;
        parsed.avatar_url = avatarUrl;
        parsed.bio = bio;
        localStorage.setItem("cineverse_user", JSON.stringify(parsed));
      }
    } catch (err: any) {
      console.error("Error saving profile", err);
      setError(err.response?.data?.error || "Failed to update profile. Please verify your details.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("cineverse_token");
    localStorage.removeItem("cineverse_user");
    navigate("/");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-slate-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <Navbar query="" onSearch={() => {}} />
 
      <main className="pt-32 pb-16 px-6 max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-10 text-white">Account Management</h1>

        {/* Global Success / Error Banners */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl px-6 py-4 text-sm font-semibold mb-6 animate-in fade-in duration-300">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl px-6 py-4 text-sm font-semibold mb-6 animate-in fade-in duration-300">
            {success}
          </div>
        )}
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
          {/* Left Sidebar - Profile Overview */}
          <div className="md:col-span-1">
             <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center">
                 <div className="relative group">
                    <img 
                       src={avatarUrl} 
                       alt="Profile Avatar" 
                       className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-white/10 bg-[#0B0F19]"
                    />
                    <button className="absolute bottom-4 right-0 bg-blue-500 p-2 rounded-full hover:bg-blue-600 transition shadow-lg text-white opacity-0 group-hover:opacity-100" title="Dicebear Avatar generated via Username">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                 </div>
                 <h2 className="text-2xl font-bold">{username}</h2>
                 <p className="text-slate-400 mt-1 text-sm">{email}</p>
                 <div className="mt-8 pt-6 w-full border-t border-white/10 space-y-3">
                     <button className="w-full text-left px-4 py-2 text-blue-400 font-medium rounded-lg bg-blue-500/10">Edit Profile</button>
                     <button 
                        className="w-full text-left px-4 py-2 text-slate-300 font-medium rounded-lg hover:bg-white/5 transition"
                        onClick={() => navigate('/watchlist')}
                      >
                        My Watchlist
                      </button>
                     <button className="w-full text-left px-4 py-2 text-slate-300 font-medium rounded-lg hover:bg-white/5 transition">Preferences</button>
                     <button className="w-full text-left px-4 py-2 text-slate-300 font-medium rounded-lg hover:bg-white/5 transition">Subscription</button>
                     <button 
                        className="w-full text-left px-4 py-2 text-red-400 font-medium rounded-lg hover:bg-red-400/10 transition mt-6"
                        onClick={handleSignOut}
                     >
                         Sign Out
                     </button>
                 </div>
             </div>
          </div>
 
          {/* Right Main Content Zone */}
          <div className="md:col-span-2 space-y-6">
             <div className="glass-panel p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                   <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div>
                   Profile Details
                </h3>
                <form onSubmit={handleSave} className="space-y-5">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                         <label className="block text-sm text-slate-400 mb-1">Username</label>
                         <input 
                           type="text" 
                           value={username} 
                           onChange={(e) => setUsername(e.target.value)} 
                           className="w-full bg-[#0B0F19]/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-sans" 
                         />
                      </div>
                      <div>
                         <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                         <input 
                           type="text" 
                           value={fullName} 
                           onChange={(e) => setFullName(e.target.value)} 
                           placeholder="Add your full name" 
                           className="w-full bg-[#0B0F19]/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-sans" 
                         />
                      </div>
                   </div>
                   <div>
                       <label className="block text-sm text-slate-400 mb-1">Bio</label>
                       <textarea 
                         rows={4} 
                         value={bio} 
                         onChange={(e) => setBio(e.target.value)} 
                         placeholder="Write something about your cinematic tastes..." 
                         className="w-full bg-[#0B0F19]/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-sans resize-none"
                       ></textarea>
                   </div>
                   <div className="flex justify-end pt-2">
                       <button 
                         type="submit" 
                         disabled={saving}
                         className="bg-gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:scale-[1.02] transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                       >
                           {saving ? "Saving Changes..." : "Save Changes"}
                       </button>
                   </div>
                </form>
             </div>
 
             <div className="glass-panel p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                   <div className="w-1.5 h-5 bg-red-500 rounded-full"></div>
                   Security
                </h3>
                <div className="flex items-center justify-between p-4 bg-[#0B0F19]/50 rounded-xl border border-slate-700">
                    <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-slate-400">Manage security settings</p>
                    </div>
                    <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition">Update</button>
                </div>
             </div>
          </div>
 
        </div>
      </main>
    </div>
  );
}

export default Profile;
