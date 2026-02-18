import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import React, { useContext, useState, useEffect } from 'react';
import { usersContext } from '../context/UsersContext';
import ProfileSidebar from './ProfileSidebar';
import Navbar from './Navbar';

const Users = () => {
  const { users, setUsers, loading, onlineUsers, socket ,userData } = useContext(usersContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const currentUser = JSON.parse(localStorage.getItem('spark_user'));
  const currentUserId = userData?._id || userData?.id;

  // ... [Keep all your existing useEffect logic for socket, newMessage, typing, etc. here] ...

const handleOpenChat = (userId) => {
  navigate(`/chat/${userId}`);
  setUsers(prev => prev.map(u => u._id === userId ? { ...u, unreadCount: 0 } : u));
};

  const handleOpenProfile = (e, userId) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  // Change your filter logic slightly to ensure sorting
const activeChats = users
  .filter(user => {
    const isNotMe = user._id !== currentUserId;
    if (searchTerm.trim() !== "") {
      return isNotMe && user.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return isNotMe && (user.lastMessage || user.lastMessageTime);
  })
  .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

  // --- SYNC SIDEBAR ACROSS DEVICES ---
 // --- SINGLE COMPREHENSIVE SYNC EFFECT ---
useEffect(() => {
  if (!socket) return;

  // 1. Handle New Messages (Snippets & Sorting)
  const handleNewMessageSync = (msg) => {
    setUsers(prevUsers => {
      const updated = prevUsers.map(user => {
        const isPartner = user._id === msg.senderId || user._id === msg.receiverId;
        const isNotMe = user._id !== currentUserId;

        if (isPartner && isNotMe) {
          return {
            ...user,
            lastMessage: msg.text,
            lastMessageTime: msg.createdAt,
            lastMessageIsImage: !!msg.image,
            lastMessageStatus: msg.status, // Track status for styling
            unreadCount: (msg.receiverId === currentUserId && !location.pathname.includes(user._id)) 
              ? (user.unreadCount || 0) + 1 
              : user.unreadCount
          };
        }
        return user;
      });
      // Move recent to top
      return [...updated].sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    });
  };

  // 2. Handle Read Events (Self & Partner)
// 2. Handle Read Events (Self & Partner)
const handleReadSync = ({ readerId, partnerId }) => {
  setUsers(prev => prev.map(u => {
    // Ensure we are comparing strings to avoid ID object mismatches
    const userIdStr = String(u._id);
    const readerIdStr = String(readerId);
    const partnerIdStr = String(partnerId);
    const currentIdStr = String(currentUserId);

    // SCENARIO A: I read these messages on another device
    // We need to find the user (partner) I was talking to and clear THEIR badge
    if (readerIdStr === currentIdStr && userIdStr === partnerIdStr) {
      return { ...u, unreadCount: 0 };
    }
    
    // SCENARIO B: The partner read MY messages
    // Their unread count for me should be 0, and my ticks/style should update
    if (readerIdStr === userIdStr && partnerIdStr === currentIdStr) {
      return { ...u, lastMessageStatus: 'read', unreadCount: 0 };
    }

    return u;
  }));
};

  socket.on("newMessage", handleNewMessageSync);
  socket.on("messagesRead", handleReadSync);
  socket.on("selfMessagesRead", handleReadSync);

  return () => {
    socket.off("newMessage", handleNewMessageSync);
    socket.off("messagesRead", handleReadSync);
    socket.off("selfMessagesRead", handleReadSync);
  };
}, [socket, currentUserId, location.pathname, setUsers]);

  return (
    /* Changed h-screen to h-full to fit AppShell's main area */
    <div className="flex h-full w-full bg-[var(--bg-primary)] overflow-hidden relative">
      <ProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      
      {/* Sidebar / Chat List */}
      {/* Sidebar / Chat List */}
<div className={`flex-col w-full md:w-[350px] lg:w-[400px] border-r border-white/5 flex z-10 bg-[var(--bg-primary)] ${location.pathname !== '/' ? 'hidden md:flex' : 'flex'}`}>
  
  {/* HEADER: Redesigned for perfect alignment */}
  <header className="px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] bg-[var(--bg-primary)] border-b border-white/5 flex flex-col gap-4 shrink-0">
    
    {/* Top Row: Profile | Title | Action */}
    <div className="flex items-center justify-between w-full h-10">
      {/* Profile Pic on Left */}
      <div 
        className="relative cursor-pointer hover:opacity-80 transition-opacity shrink-0" 
        onClick={() => setIsProfileOpen(true)}
      >
        <img 
          src={currentUser?.profilepic} 
          className="w-9 h-9 rounded-xl border border-white/10 object-cover shadow-md" 
          alt="Me" 
        />
      </div>

      {/* Centered Title */}
     <h1 
  className="font-['Merienda',_serif] font-extrabold tracking-[0.2em] text-[25px] bg-gradient-to-r from-cyan-400 via-cyan-100 to-red-500 inline-block"
  style={{
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent'
  }}
>
  SparK
</h1>

      {/* Plus Button on Right */}
      <button 
        onClick={() => navigate('/requests')} 
        className="w-9 h-9 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20 active:scale-90 transition-transform shrink-0"
      >
        <i className='bx bx-plus text-white text-xl'></i>
      </button>
    </div>
    
    {/* Search Bar Row */}
    <div className="relative flex items-center bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 focus-within:bg-white/10 focus-within:border-white/10 transition-all">
      <i className='bx bx-search text-white/30 text-lg mr-3'></i>
      <input 
        type="text" 
        placeholder="Search chats..." 
        className="bg-transparent outline-none text-white w-full text-sm placeholder:text-white/20" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
    </div>
  </header>

  {/* ... Rest of the LIST AREA remains the same ... */}


        {/* LIST AREA: Optimized scrolling */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
          {activeChats.map((user) => (
            <div 
              key={user._id} 
              onClick={() => handleOpenChat(user._id)} 
              className={`flex items-center p-4 cursor-pointer hover:bg-white/5 transition-all active:bg-white/10 ${location.pathname.includes(user._id) ? 'bg-white/10 border-l-4 border-[var(--accent-secondary)]' : ''}`}
            >
              <div className="relative" onClick={(e) => handleOpenProfile(e, user._id)}>
                <img src={user.profilepic} className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg" alt={user.name} />
                {onlineUsers.includes(user._id) && (
                   <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[var(--bg-primary)] rounded-full shadow-md"></div>
                )}
              </div>
              
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-white font-bold truncate text-[15px]">{user.name}</h3>
                  <span className="text-[9px] text-white/30 uppercase font-black">
                    {user.lastMessageTime && new Date(user.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                 <p className={`text-xs truncate max-w-[85%] ${
  user.isTyping 
    ? 'text-emerald-400 font-bold' 
    : (user.unreadCount > 0 
        ? 'text-white font-black opacity-100' // UNREAD style
        : 'text-white/40 font-medium')       // READ style
}`}>
  {user.isTyping ? 'typing...' : user.lastMessage || "Start the flow..."}
</p>
                  {user.unreadCount > 0 && (
                    <div className="bg-[var(--accent-primary)] text-white text-[10px] h-5 w-5 rounded-lg flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20 font-bold">
                      {user.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANE (Desktop) / FULL OVERLAY (Mobile) */}
      <div className={`flex-1 h-full bg-black/10 backdrop-blur-sm ${location.pathname === '/' ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {location.pathname === '/' ? (
          <div className="text-center animate-pulse">
            <p className="text-white/10 font-black tracking-[0.4em] uppercase text-xs">Select a Conversation</p>
          </div>
        ) : (
          <Outlet />
        )}
      </div>


      <Navbar />
    </div>
  );
};

export default Users;