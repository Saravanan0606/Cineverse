import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Profile() {
  const navigate = useNavigate();

  // Mock static data to showcase UI structure
  const user = {
    username: "Cinephile99",
    email: "user@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4"
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      {/* We reuse the Navbar but passing empty search as profile has no active search bar functionality */}
      <Navbar query="" onSearch={() => {}} />

      <main className="pt-32 pb-16 px-6 max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-10 text-white">Account Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           
          {/* Left Sidebar - Profile Overview */}
          <div className="md:col-span-1">
             <div className="glass-panel p-8 rounded-3xl flex flex-col items-center text-center">
                 <div className="relative group">
                    <img 
                       src={user.avatar} 
                       alt="Profile Avatar" 
                       className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-white/10"
                    />
                    <button className="absolute bottom-4 right-0 bg-blue-500 p-2 rounded-full hover:bg-blue-600 transition shadow-lg text-white opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                 </div>
                 <h2 className="text-2xl font-bold">{user.username}</h2>
                 <p className="text-slate-400 mt-1 text-sm">{user.email}</p>
                 <div className="mt-8 pt-6 w-full border-t border-white/10 space-y-3">
                     <button className="w-full text-left px-4 py-2 text-blue-400 font-medium rounded-lg bg-blue-500/10">Edit Profile</button>
                     <button className="w-full text-left px-4 py-2 text-slate-300 font-medium rounded-lg hover:bg-white/5 transition">My Watchlist</button>
                     <button className="w-full text-left px-4 py-2 text-slate-300 font-medium rounded-lg hover:bg-white/5 transition">Preferences</button>
                     <button className="w-full text-left px-4 py-2 text-slate-300 font-medium rounded-lg hover:bg-white/5 transition">Subscription</button>
                     <button 
                        className="w-full text-left px-4 py-2 text-red-400 font-medium rounded-lg hover:bg-red-400/10 transition mt-6"
                        onClick={() => navigate('/login')}
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
                <form className="space-y-5">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                         <label className="block text-sm text-slate-400 mb-1">Username</label>
                         <input type="text" defaultValue={user.username} className="w-full bg-[#0B0F19]/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-sans" />
                      </div>
                      <div>
                         <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                         <input type="text" placeholder="Add your full name" className="w-full bg-[#0B0F19]/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-sans" />
                      </div>
                   </div>
                   <div>
                       <label className="block text-sm text-slate-400 mb-1">Bio</label>
                       <textarea rows={4} placeholder="Write something about your cinematic tastes..." className="w-full bg-[#0B0F19]/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-sans resize-none"></textarea>
                   </div>
                   <div className="flex justify-end pt-2">
                       <button type="button" className="bg-gradient-primary text-white font-bold px-8 py-3 rounded-xl hover:scale-[1.02] transition-all shadow-lg hover:shadow-blue-500/30">
                           Save Changes
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
                        <p className="text-sm text-slate-400">Last changed 3 months ago</p>
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
