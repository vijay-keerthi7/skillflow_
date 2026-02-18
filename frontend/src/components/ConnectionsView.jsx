import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ConnectionsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('followers'); 
  const [data, setData] = useState({ followers: [], following: [], mutuals: [], userName: "" });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('spark_user'));
        const myId = currentUser?._id || currentUser?.id;
        
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/connections/${id}?myId=${myId}`);
        // Ensure your backend sends the user's name too
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch connections", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, [id]);

  // SEARCH FILTER LOGIC
  const filteredList = (data[activeTab] || []).filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderList = () => {
    const currentUser = JSON.parse(localStorage.getItem('spark_user'));
    const myId = currentUser?._id || currentUser?.id;

    if (filteredList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <i className='bx bx-search-alt text-5xl mb-2'></i>
          <p>{searchTerm ? "No users match your search" : "No users found here"}</p>
        </div>
      );
    }

    return filteredList.map((u) => {
      const isMe = String(u._id) === String(myId);

      if (isMe) {
        return (
          <div key="is-me" className="flex items-center justify-between p-4 bg-cyan-400/10 border border-cyan-400/20 rounded-2xl mb-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center">
                <i className='bx bxs-user text-cyan-400 text-xl'></i>
              </div>
              <div>
                <h4 className="text-cyan-400 font-black text-sm tracking-widest">YOU</h4>
                <p className="text-cyan-400/50 text-xs">{u.name}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-cyan-400/20 text-cyan-400 text-[10px] font-black uppercase rounded-lg">Self</span>
          </div>
        );
      }

      return (
        <div 
          key={u._id} 
          onClick={() => navigate(`/profile/${u._id}`)}
          className="flex items-center justify-between p-4 hover:bg-white/5 transition-all cursor-pointer rounded-2xl mb-2 group"
        >
          <div className="flex items-center gap-4">
            <img src={u.profilepic} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white/5" />
            <div>
              <h4 className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">{u.name}</h4>
              <p className="text-white/40 text-xs">@{u.email?.split('@')[0]}</p>
            </div>
          </div>
          <i className='bx bx-chevron-right text-white/20 text-xl group-hover:text-cyan-400 transition-all'></i>
        </div>
      );
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-0 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-2xl sm:rounded-[40px] border-x border-b border-white/10 shadow-2xl flex flex-col h-screen sm:h-[85vh]">
        
        {/* 1. TOP NAVIGATION BAR */}
        <div className="p-6 border-b border-white/10 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} // Goes back to the Profile
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all"
          >
            <i className='bx bx-left-arrow-alt text-2xl'></i>
          </button>
          <div>
            <h2 className="text-white font-black text-lg leading-tight">
              {data.userName || "User"}
            </h2>
            <p className="text-cyan-400/50 text-[10px] uppercase tracking-widest font-bold">Connections</p>
          </div>
        </div>

        {/* 2. TAB NAVIGATION */}
        <div className="flex border-b border-white/5">
          {['followers', 'following', 'mutuals'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchTerm(""); }}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                activeTab === tab ? 'text-cyan-400' : 'text-white/30 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"></div>
              )}
            </button>
          ))}
        </div>

        {/* 3. SEARCH BAR */}
        <div className="p-4">
          <div className="relative group">
            <i className={`bx bx-search absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-cyan-400' : 'text-white/20'}`}></i>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-all focus:bg-white/[0.07]"
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                    <i className='bx bx-x'></i>
                </button>
            )}
          </div>
        </div>

        {/* 4. LIST AREA */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-10">
          {renderList()}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsView;