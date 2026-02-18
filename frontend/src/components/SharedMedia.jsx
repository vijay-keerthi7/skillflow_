import React, { useState } from 'react';

const SharedMedia = ({ sharedMedia, onClose, selectedMsgs, toggleSelect, setActiveIndex, onForward, onOpenDoc }) => {
  const [activeTab, setActiveTab] = useState('media'); 

  const mediaItems = sharedMedia.filter(msg => msg.image);
  const docItems = sharedMedia.filter(msg => msg.document);

  return (
    <div className="fixed inset-0 z-[1500] bg-[#121b22] flex flex-col font-sans">
      <header className="p-4 flex items-center bg-[#202c33] shadow-md z-10">
        <button onClick={onClose} className="text-white/70 hover:text-white mr-4 transition-colors">
          <i className='bx bx-left-arrow-alt text-3xl'></i>
        </button>
        <h2 className="text-white font-bold text-lg">Shared Media</h2>
      </header>

      <div className="flex bg-[#202c33] border-b border-white/5">
        <button 
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'media' ? 'text-cyan-400 border-cyan-400' : 'text-white/40 border-transparent hover:text-white/70'}`}
        >
          Media ({mediaItems.length})
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'docs' ? 'text-cyan-400 border-cyan-400' : 'text-white/40 border-transparent hover:text-white/70'}`}
        >
          Docs ({docItems.length})
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        
        {/* --- MEDIA TAB --- */}
        {activeTab === 'media' && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {mediaItems.length === 0 && <p className="col-span-full text-center text-white/30 mt-10">No media found.</p>}
            {mediaItems.map((msg, index) => {
              const isSelected = selectedMsgs.some(m => (m._id || m.id) === (msg._id || msg.id));
              const originalIndex = sharedMedia.findIndex(m => (m._id || m.id) === (msg._id || msg.id));
              
              return (
                <div key={msg._id || index} className="relative aspect-square group border border-white/5 rounded-lg overflow-hidden bg-black/40">
                  <img 
                    src={msg.image} 
                    className={`w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105 ${isSelected ? 'opacity-50 scale-95' : ''}`} 
                    alt="" 
                    onClick={() => setActiveIndex(originalIndex)} 
                  />
                  <div className="absolute top-2 left-2 z-10">
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleSelect(msg)}
                      className="w-5 h-5 rounded border-white/20 accent-cyan-500 cursor-pointer shadow-lg"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- DOCS TAB --- */}
        {activeTab === 'docs' && (
          <div className="flex flex-col gap-2 max-w-3xl mx-auto">
             {docItems.length === 0 && <p className="text-center text-white/30 mt-10">No documents found.</p>}
             {docItems.map((msg, index) => {
                const isSelected = selectedMsgs.some(m => (m._id || m.id) === (msg._id || msg.id));
                const isPdf = msg.document.name.endsWith('.pdf');
                
                return (
                  <div key={msg._id || index} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isSelected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-black/20 border-white/5 hover:bg-black/40'}`}>
                    
                    {/* SELECTION AREA */}
                    <div className="flex items-center justify-center p-2 cursor-pointer" onClick={() => toggleSelect(msg)}>
                       <input 
                         type="checkbox" 
                         checked={isSelected} 
                         onChange={() => {}} 
                         className="w-5 h-5 rounded border-white/20 accent-cyan-500 pointer-events-none"
                       />
                    </div>

                    <div className={`p-3 rounded-lg ${isPdf ? 'bg-rose-500/20 text-rose-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      <i className={`bx ${isPdf ? 'bxs-file-pdf' : 'bxs-file-blank'} text-3xl`}></i>
                    </div>
                    
                    {/* VIEWING AREA: Relies on the parent onOpenDoc function */}
                    <div className="flex-1 overflow-hidden min-w-[120px] cursor-pointer" onClick={() => onOpenDoc(msg.document)}>
                      <p className="text-sm font-bold text-white truncate hover:text-cyan-400 transition-colors">{msg.document.name}</p>
                      <p className="text-[11px] text-white/50 uppercase font-bold tracking-wider mt-0.5">
                        {msg.document.size > 1024 * 1024 ? (msg.document.size / (1024 * 1024)).toFixed(2) + ' MB' : (msg.document.size / 1024).toFixed(0) + ' KB'} 
                        {' • '} {new Date(msg.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                  </div>
                );
             })}
          </div>
        )}

      </div>
      
      {/* Selection Footer */}
      {selectedMsgs.length > 0 && (
        <div className="p-4 bg-[#202c33] border-t border-white/5 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.3)] z-10">
          <span className="text-cyan-400 font-bold text-sm">{selectedMsgs.length} items selected</span>
          <button 
            onClick={onForward} 
            className="bg-cyan-500 hover:bg-cyan-400 text-[#121b22] px-6 py-2.5 rounded-full font-black tracking-wide transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <span>Forward</span>
            <i className='bx bx-share text-lg'></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default SharedMedia;