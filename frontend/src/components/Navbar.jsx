import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { usersContext } from '../context/UsersContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // Destructure notifications (even if it's currently an empty array in context)
  // to avoid the "length of undefined" crash.
  const { notifications = [] } = useContext(usersContext);

  const navs = [
    { path: '/', icon: 'bx-message-rounded-dots', label: 'Chats' },
    { 
      path: '/notifications', 
      icon: 'bx-bell', 
      label: 'Activity', 
      badge: notifications?.length || 0 
    },
    { path: '/suggested', icon: 'bx-compass', label: 'Explore' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] w-auto pointer-events-none">
      <nav className="bg-[#121b22]/80 backdrop-blur-2xl px-3 py-2 rounded-full flex gap-1 pointer-events-auto transition-all duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
        {navs.map((nav) => {
          const isActive = pathname === nav.path;
          return (
            <button
              key={nav.path}
              onClick={() => navigate(nav.path)}
              className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-full transition-all duration-500 overflow-hidden ${
                isActive 
                  ? 'bg-cyan-400 text-black scale-105 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {/* Active Glow Effect */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 to-transparent animate-pulse" />
              )}
              
              <i className={`bx ${nav.icon} text-2xl relative z-10`}></i>
              
              {isActive && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10 animate-in fade-in zoom-in-95 duration-300">
                  {nav.label}
                </span>
              )}
              
              {/* Badge: Shows notification count */}
              {nav.badge > 0 && (
                <span className={`absolute top-2 right-4 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#121b22] transition-colors duration-700 ${
                    isActive ? 'bg-black text-cyan-400' : 'bg-cyan-500 text-black'
                }`}>
                  {nav.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Navbar;