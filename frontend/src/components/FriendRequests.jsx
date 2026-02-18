import React, { useContext, useState, useEffect, useRef } from 'react';
import { usersContext } from '../context/UsersContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FriendRequests = () => {
  const { pendingRequests, handleAcceptRequest, handleRejectRequest, loading: contextLoading } = useContext(usersContext);
  const [suggested, setSuggested] = useState([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/suggested`);
        setSuggested(res.data);
      } catch (error) {
        console.error("Error fetching suggested users", error);
      } finally {
        setSuggestedLoading(false);
      }
    };
    fetchSuggested();
  }, []);

  const handleConnect = async (e, userId) => {
    e.stopPropagation();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/users/connect/${userId}`);
      // Optionally remove user from suggested list after connecting
      setSuggested(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      console.error("Connection failed", err);
    }
  };

  if (contextLoading) return <div className="flex-1 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex-1 bg-[#1D546D] p-6 overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-8 mt-4">Friend Requests</h1>

      {/* --- PENDING REQUESTS --- */}
      <div className="grid gap-4 mb-12">
        {pendingRequests.map((request) => (
          <div key={request._id} className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-[24px] hover:bg-white/15 transition-all">
            <div className="flex items-center gap-4">
              <img src={request.from?.profilepic || "https://i.pravatar.cc/150"} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400" />
              <h3 className="text-white font-bold text-lg">{request.from?.name}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAcceptRequest(request.from._id)} className="p-3 bg-emerald-500 text-white rounded-xl"><i className='bx bx-check text-xl'></i></button>
              <button onClick={() => handleRejectRequest(request.from._id)} className="p-3 bg-white/10 text-white rounded-xl"><i className='bx bx-x text-xl'></i></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- SUGGESTED USERS (Fixed Scrolling) --- */}
      <div className="mt-12 w-full overflow-x-scroll">
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6">People You May Know</h2>
        
        <div 
          ref={scrollRef}
          className="flex flex-nowrap gap-4 overflow-x-auto scrollbar-hide pb-8 w-full snap-x"
        >
          {suggestedLoading ? (
             [1,2,3].map(i => <div key={i} className="flex-none w-[220px] h-[280px] bg-white/5 rounded-[32px] animate-pulse" />)
          ) : (
            suggested.map((user) => (
              <div 
                key={user._id} 
                onClick={() => navigate(`/profile/${user._id}`)}
                /* flex-none is the MAGIC CLASS here */
                className="flex-none relative flex flex-col items-center bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] w-[220px] hover:bg-white/15 transition-all cursor-pointer snap-center"
              >
                <div className="relative w-24 h-24 mb-4 flex-shrink-0">
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-lg"></div>
                  <img src={user.profilepic || "https://i.pravatar.cc/150"} alt="" className="relative w-full h-full rounded-full object-cover border-2 border-white/10" />
                </div>

                <h3 className="text-white font-bold text-base mb-1 truncate w-full text-center">{user.name}</h3>
                <p className="text-white/40 text-[10px] uppercase font-black mb-5">Suggested for you</p>

                <button 
                  onClick={(e) => handleConnect(e, user._id)}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-[#1D546D] rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Connect
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;