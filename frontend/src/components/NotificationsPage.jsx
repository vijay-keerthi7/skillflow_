import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersContext } from '../context/UsersContext';

const NotificationsPage = () => {
  const { notifications=[], loading } = useContext(usersContext);
  const navigate = useNavigate();

    const hasNotifications = Array.isArray(notifications) && notifications.length > 0;

  if (loading) return (
    <div className="min-h-screen bg-[#0b141a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b141a] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black text-white tracking-tighter">Activity</h1>
          <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            {notifications.length} New
          </span>
        </header>

        <div className="space-y-3">
          {!hasNotifications ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
              <i className='bx bx-bell-off text-6xl mb-4'></i>
              <p className="font-bold uppercase tracking-widest text-xs">No activity yet</p>
            </div>
          ) : (
            notifications.map((notif, index) => (
              <div 
                key={index}
                onClick={() => notif.fromId && navigate(`/profile/${notif.fromId}`)}
                className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[24px] transition-all cursor-pointer animate-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={notif.fromPic || 'https://via.placeholder.com/150'} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/20" 
                      alt="" 
                    />
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#0b141a]">
                      <i className='bx bxs-user text-[10px] text-black'></i>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-white leading-tight">
                      <span className="font-bold">{notif.from || "Someone"}</span> {notif.message}
                    </p>
                    <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <i className='bx bx-chevron-right text-white/10 group-hover:text-cyan-400 transition-colors'></i>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;