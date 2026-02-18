import React, { useState, useContext, useRef } from 'react';
import { usersContext } from '../context/UsersContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfileSidebar = ({ isOpen, onClose }) => {
  const { users, setUsers, socket } = useContext(usersContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Get current user from storage
  const user = JSON.parse(localStorage.getItem('spark_user'));
  const userId = user?._id || user?.id;

  // Find the LIVE version of the current user for real-time stats
  const liveUser = users.find(u => String(u._id) === String(userId)) || user;

  // States
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [about, setAbout] = useState(user?.about || "Available");
  const [profilepic, setProfilepic] = useState(user?.profilepic || "");

  // --- Handlers ---
  const handleImageClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Convert to Base64
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilepic(base64String);
        handleUpdate(name, about, base64String); // Auto-save image
      };
    }
  };

  const handleUpdate = async (updatedName = name, updatedAbout = about, updatedPic = profilepic) => {
    try {
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/auth/update-profile`, {
        userId,
        name: updatedName,
        about: updatedAbout,
        profilepic: updatedPic
      });

      // Update LocalStorage
      localStorage.setItem('spark_user', JSON.stringify(res.data));
      
      // Update Context (Sidebar & Chat Header)
      setUsers(prev => prev.map(u => String(u._id) === String(res.data._id) ? { ...u, ...res.data } : u));
      if (socket) {
        socket.emit("updateProfile", res.data);
      }
      setIsEditingName(false);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  // --- Navigation Helpers ---
  const handleNavigate = (path) => {
    navigate(path);
    onClose(); // Close sidebar when navigating
  };

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>

      <div className="relative w-full md:w-[380px] h-full bg-[#0b141a] border-r border-white/10 shadow-2xl flex flex-col">
        
        {/* HEADER */}
        <header className="px-6 py-8 bg-white/5 backdrop-blur-md flex items-end gap-6 text-white text-bold border-b border-white/5">
          <button onClick={onClose} className="mb-1 hover:scale-110 transition-transform text-white/70 hover:text-white">
            <i className='bx bx-arrow-back text-2xl'></i>
          </button>
          <h1 className="text-xl font-extrabold tracking-wide">My Profile</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center custom-scrollbar">
          
          {/* AVATAR SECTION */}
          <div className="relative group cursor-pointer mb-4" onClick={handleImageClick}>
            <img 
              src={profilepic || "https://i.pravatar.cc/150"} 
              className="w-36 h-36 rounded-full border-4 border-[#1D546D] shadow-2xl transition-all group-hover:opacity-60 object-cover"
              alt="Profile"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <i className='bx bx-camera text-4xl text-white'></i>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-6">
            @{liveUser?.email?.split('@')[0]}
          </p>

          {/* LIVE STATS ROW & VIEW PROFILE */}
          <div className="w-full bg-white/5 rounded-2xl p-4 mb-8">
            <div className="flex justify-around items-center mb-4">
              <div 
                className="text-center cursor-pointer hover:bg-white/5 p-2 rounded-xl transition"
                onClick={() => handleNavigate(`/profile/${userId}/connections`)}
              >
                <p className="text-xl font-light text-white">
                  {liveUser?.followersCount ?? liveUser?.followers?.length ?? 0}
                </p>
                <p className="text-[10px] uppercase font-black text-white/40">Followers</p>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div 
                className="text-center cursor-pointer hover:bg-white/5 p-2 rounded-xl transition"
                onClick={() => handleNavigate(`/profile/${userId}/connections`)}
              >
                <p className="text-xl font-light text-white">
                  {liveUser?.followingCount ?? liveUser?.following?.length ?? 0}
                </p>
                <p className="text-[10px] uppercase font-black text-white/40">Following</p>
              </div>
            </div>
            
            <button 
              onClick={() => handleNavigate(`/profile/${userId}`)}
              className="w-full py-2 bg-cyan-500/10 text-cyan-400 font-bold text-sm rounded-xl hover:bg-cyan-500/20 transition-colors border border-cyan-500/20"
            >
              View Full Profile
            </button>
          </div>

          <div className="w-full space-y-6">
            
            {/* NAME FIELD */}
            <div className="space-y-1">
              <label className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Display Name</label>
              <div className="flex justify-between items-center py-2 border-b border-white/10 group">
                {isEditingName ? (
                  <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                    onBlur={() => handleUpdate()} 
                    autoFocus
                    className="bg-transparent text-white text-lg outline-none w-full"
                  />
                ) : (
                  <span className="text-white text-lg">{name}</span>
                )}
                <i 
                  className={`bx ${isEditingName ? 'bx-check text-emerald-400' : 'bx-pencil text-white/20 group-hover:text-cyan-400'} cursor-pointer transition-colors text-xl`}
                  onClick={() => isEditingName ? handleUpdate() : setIsEditingName(true)}
                ></i>
              </div>
            </div>

            {/* ABOUT FIELD */}
            <div className="space-y-1">
              <label className="text-xs text-cyan-400 font-bold uppercase tracking-widest">About</label>
              <div className="flex justify-between items-center py-2 border-b border-white/10 group">
                <input 
                  value={about} 
                  onChange={(e) => setAbout(e.target.value)}
                  onBlur={() => handleUpdate()}
                  className="bg-transparent text-white/80 outline-none w-full"
                />
                <i className='bx bx-pencil text-white/20 group-hover:text-cyan-400 transition-colors text-xl'></i>
              </div>
            </div>

            {/* SETTINGS MENU */}
            <div className="pt-6">
              <h3 className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-4">Settings & Privacy</h3>
              
              <div className="flex flex-col gap-2">
                
                {/* Account Type Toggle (UI Placeholder) */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition cursor-pointer">
                  <div className="flex items-center gap-4 text-white/70">
                    <i className='bx bx-lock-alt text-xl'></i>
                    <span className="text-sm font-medium">Private Account</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${liveUser?.accountType === 'private' ? 'bg-cyan-400' : 'bg-white/20'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${liveUser?.accountType === 'private' ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition cursor-pointer">
                  <div className="flex items-center gap-4 text-white/70">
                    <i className='bx bx-bell text-xl'></i>
                    <span className="text-sm font-medium">Notifications</span>
                  </div>
                  <i className='bx bx-chevron-right text-white/30 text-xl'></i>
                </div>

                {/* Theme */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition cursor-pointer">
                  <div className="flex items-center gap-4 text-white/70">
                    <i className='bx bx-palette text-xl'></i>
                    <span className="text-sm font-medium">Theme</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">Dark</span>
                </div>

                <div className="h-px w-full bg-white/5 my-2"></div>

                {/* Logout */}
                <div 
                  onClick={() => {
                    localStorage.removeItem('spark_user');
                    window.location.href = '/auth';
                  }} 
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 cursor-pointer transition-colors mt-2"
                >
                  <i className='bx bx-log-out text-xl'></i>
                  <span className="text-sm font-bold">Log Out</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;