import React from 'react';

const ProfileModal = ({ user, isOnline, sharedMedia, onClose, onViewAllMedia }) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1D546D] border border-white/20 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="h-24 bg-gradient-to-r from-cyan-500 to-blue-600 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white text-xl">
            <i className='bx bx-x'></i>
          </button>
        </div>
        <div className="px-8 pb-8 text-center -mt-12">
          <img src={user.profilepic} className="w-24 h-24 rounded-3xl border-4 border-[#1D546D] mx-auto object-cover" alt="" />
          <h2 className="text-2xl font-bold text-white mt-4">{user.name}</h2>
          <p className="text-cyan-400 text-sm">{user.email}</p>
          <div className="mt-4 bg-white/5 p-3 rounded-2xl text-white/70 text-sm">
            {user.bio || "No bio available."}
          </div>
          

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;