import React, { useContext } from 'react';
import { usersContext } from '../context/UsersContext';
import { useNavigate } from 'react-router-dom';

const ProfileView = ({ user: initialUser, mutuals }) => {
  const { users, handleToggleFollow, userData, onlineUsers } = useContext(usersContext);
  const navigate = useNavigate();

  const currentUserId = userData?._id || userData?.id;
  
  // 1. Find the live version of this profile
  const liveUser = users.find(u => String(u._id) === String(initialUser._id)) || initialUser;

  // 2. ONLINE CHECK: Is this user's ID in the onlineUsers array?
  const isOnline = onlineUsers.includes(String(liveUser._id));

  // 3. Logic for Follow Status (Priority: Socket Boolean > Array check)
  const iFollowThem = typeof liveUser.isFollowing === 'boolean' 
    ? liveUser.isFollowing 
    : (Array.isArray(liveUser.followers) && liveUser.followers.includes(currentUserId));
  
  const theyFollowMe = Array.isArray(liveUser.following) && liveUser.following.includes(currentUserId);
  const isChatLocked = liveUser.accountType === 'private' && !theyFollowMe;

  const buttonText = iFollowThem ? "Following" : (theyFollowMe ? "Follow Back" : "Follow");

  return (
    <div className="min-h-screen bg-[#0b141a] p-4 sm:p-10 transition-all duration-500">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-5 w-full flex justify-center lg:sticky lg:top-10">
          <div className="relative w-full max-w-md bg-white/10 backdrop-blur-3xl rounded-[48px] border border-white/20 p-8 shadow-2xl">
            
            <div className="relative w-full aspect-square mb-6 group">
               <img 
                 src={liveUser.profilepic} 
                 className={`w-full h-full object-cover rounded-[42px] border-[8px] border-white/5 transition-all duration-700 ${liveUser.accountType === 'private' && !iFollowThem ? 'blur-2xl grayscale' : ''}`} 
                 alt={liveUser.name} 
               />
               
               {/* ONLINE DOT */}
               {isOnline && (
                 <div className="absolute bottom-6 right-6 w-8 h-8 bg-green-500 border-4 border-[#0b141a] rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
               )}

               {liveUser.accountType === 'private' && !iFollowThem && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-[42px]">
                   <i className='bx bxs-lock-alt text-white text-5xl opacity-80'></i>
                   <p className="text-white text-xs font-bold mt-2 tracking-widest uppercase">Private</p>
                 </div>
               )}
            </div>

            <div className="px-2">
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                {liveUser.name}
              </h2>
              <p className="text-white/30 font-bold text-xs tracking-widest uppercase">@{liveUser.email?.split('@')[0]}</p>
              
              <div className="mt-8 grid grid-cols-3 gap-3">
                {/* LIVE FOLLOWERS */}
                <div className="bg-white/5 p-3 rounded-[24px] text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate(`/profile/${liveUser._id}/connections`)}>
                  <p className="text-lg font-light text-white">
                    {liveUser.followersCount ?? liveUser.followers?.length ?? 0}
                  </p>
                  <p className="text-[9px] uppercase font-black text-white/40">Followers</p>
                </div>

                {/* LIVE FOLLOWING */}
                <div className="bg-white/5 p-3 rounded-[24px] text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate(`/profile/${liveUser._id}/connections`)}>
                  <p className="text-lg font-light text-white">
                    {liveUser.followingCount ?? liveUser.following?.length ?? 0}
                  </p>
                  <p className="text-[9px] uppercase font-black text-white/40">Following</p>
                </div>

                {/* MUTUALS (Restored from your original prop) */}
                <div className="bg-white/5 p-3 rounded-[24px] text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate(`/profile/${liveUser._id}/connections`)}>
                  {/* Checks for mutuals count, array length, or just the number depending on how the parent passes it */}
                  <p className="text-lg font-light text-white">
                    {mutuals?.count ?? mutuals?.length ?? mutuals ?? 0}
                  </p>
                  <p className="text-[9px] uppercase font-black text-white/40">Mutuals</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => handleToggleFollow(liveUser._id)} 
                className={`flex-1 py-4 font-bold rounded-2xl transition-all ${iFollowThem ? 'bg-white/10 text-white border border-white/10' : 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20'}`}
              >
                {buttonText}
              </button>

              <button 
                onClick={() => !isChatLocked && navigate(`/chat/${liveUser._id}`)}
                className={`p-4 rounded-2xl border transition-all ${isChatLocked ? "bg-red-500/10 border-red-500/20 text-red-400 cursor-not-allowed" : "bg-white/5 text-white border-white/10 hover:bg-cyan-400 hover:text-black"}`}
                title={isChatLocked ? "Private Account: Follow back required" : "Send Message"}
              >
                <i className={`bx ${isChatLocked ? 'bxs-lock-alt' : 'bx-message-square-detail'} text-xl`}></i>
              </button>
            </div>

            {isChatLocked && (
              <p className="text-[10px] text-center text-red-400/60 font-bold uppercase tracking-tighter mt-3">
                Chat locked by {liveUser.name} (Private Account)
              </p>
            )}
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="lg:col-span-7 w-full pb-20">
           <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-6">Portfolio</h3>
           {liveUser.accountType === 'private' && !iFollowThem ? (
             <div className="p-20 bg-white/5 rounded-[40px] border border-dashed border-white/10 text-center">
               <i className='bx bxs-lock text-6xl text-white/10 mb-4'></i>
               <h4 className="text-white font-bold text-lg">This Account is Private</h4>
               <p className="text-white/40 text-sm">Follow this user to see their photos and videos.</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="aspect-square bg-white/5 rounded-[24px] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                    <i className='bx bx-image text-white/5 text-4xl group-hover:scale-110 transition-transform'></i>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;