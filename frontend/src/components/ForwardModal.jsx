import React, { useState } from 'react';

const ForwardModal = ({ users, onClose, onConfirm, isProcessing }) => {
  const [targetContacts, setTargetContacts] = useState([]);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleContact = (userId) => {
    setTargetContacts(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1D546D] border border-white/20 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Forward to...</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white"><i className='bx bx-x text-2xl'></i></button>
          </div>
          <input 
            type="text" 
            placeholder="Search contacts..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {filteredUsers.map(user => (
            <div 
              key={user._id} 
              onClick={() => toggleContact(user._id)}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${targetContacts.includes(user._id) ? 'bg-cyan-500/20 border border-cyan-500/50' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <img src={user.profilepic} className="w-10 h-10 rounded-full object-cover" alt="" />
              <span className="text-white font-medium flex-1">{user.name}</span>
              {targetContacts.includes(user._id) && <i className='bx bxs-check-circle text-cyan-400 text-xl'></i>}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10">
          <button 
            disabled={targetContacts.length === 0 || isProcessing}
            onClick={() => onConfirm(targetContacts)}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#1D546D] font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-[#1D546D] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <><i className='bx bxs-send'></i> Forward to {targetContacts.length} people</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;