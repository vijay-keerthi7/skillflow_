import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersContext } from '../context/UsersContext';
import axios from 'axios';
import Users from './Users';
import SharedMedia from './SharedMedia';
import ChatInput from './ChatInput';
import ProfileModal from './ProfileModal';
import ImageGallery from './imageGallery';
import ForwardModal from './ForwardModal';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
const ChatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, setUsers, onlineUsers, socket } = useContext(usersContext);

  // States
  const [chatHistory, setChatHistory] = useState([]);
  const [viewingAllMedia, setViewingAllMedia] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [wallpaper, setWallpaper] = useState(localStorage.getItem('chat_bg') || "");
  const [downloadedMedia, setDownloadedMedia] = useState(() => JSON.parse(localStorage.getItem('downloaded_media') || '[]'));
  
  // Forwarding States
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [isProcessingForward, setIsProcessingForward] = useState(false);

  // Refs
  const scrollRef = useRef(null);
  const wallpaperInputRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('spark_user'));
  const currentUserId = currentUser?._id || currentUser?.id;
  const activeUser = users?.find((u) => u._id === id);
  const isUserOnline = onlineUsers?.includes(activeUser?._id);

  const sharedMedia = chatHistory.filter(msg => {
    if (msg.isDeleted) return false;
    if (!msg.image && !msg.document) return false;
    const isMe = msg.senderId === currentUserId;
    return isMe || downloadedMedia.includes(msg._id || msg.id);
  });

  // --- UPDATED: Smart Document Handler ---
  // --- UPDATED: Smart Document Handler ---
  const handleOpenDoc = async(document) => {
    const fileUrl = document.data;

    try {
      // 1. CLOUDINARY URL: Open directly (Google Viewer is deprecated)
      if (fileUrl.startsWith('http')) {
        if (Capacitor.isNativePlatform()) {
          await Browser.open({ url: fileUrl, presentationStyle: 'popover' });
        } else {
          window.open(fileUrl, '_blank');
        }
        return;
      }

      // 2. Legacy Base64 Fallback
      const base64WithoutPrefix = fileUrl.split(',')[1];
      const byteCharacters = atob(base64WithoutPrefix);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: document.type || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);

      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      
    } catch (error) {
      console.error("Failed to open document:", error);
      alert("Could not open this file.");
    }
  };

  const forwardableUsers = users?.filter(u => {
    if (u._id === currentUserId) return false;
    const iFollowThem = u.isFollowing === true;
    return u.accountType !== 'private' || iFollowThem;
  }) || [];

  const handleWallpaperChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWallpaper(reader.result);
        localStorage.setItem('chat_bg', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const markAsDownloaded = (msgId) => {
    if (!downloadedMedia.includes(msgId)) {
      const updated = [...downloadedMedia, msgId];
      setDownloadedMedia(updated);
      localStorage.setItem('downloaded_media', JSON.stringify(updated));
    }
  };

  const toggleSelect = (msg) => {
    if (msg.isDeleted) return;
    const msgId = msg._id || msg.id;
    setSelectedMsgs(prev => prev.find(m => (m._id || m.id) === msgId)
      ? prev.filter(m => (m._id || m.id) !== msgId)
      : [...prev, msg]
    );
  };

  const handleBulkForward = async (targetContactIds) => {
    if (targetContactIds.length === 0 || selectedMsgs.length === 0) return; 
    setIsProcessingForward(true); 
    try {
      for (const contactId of targetContactIds) {
        for (const msg of selectedMsgs) { 
          if (msg.isDeleted) continue; 
          
          await axios.post(`${process.env.REACT_APP_API_URL}/messages/send/${contactId}`, { 
            senderId: currentUserId, 
            text: msg.text || "", 
            image: msg.image || null,
            document: msg.document || null 
          }); 
          
        } 
      } 
      navigate(`/chat/${targetContactIds[targetContactIds.length - 1]}`);
    } catch (err) { 
      console.error("Forwarding failed", err); 
      alert("Failed to forward some messages.");
    } finally { 
      setIsProcessingForward(false); 
      setIsForwarding(false); 
      setSelectedMsgs([]); 
    }
  };

  const handleSend = async (text, image = null, document = null) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/messages/send/${id}`, {
        senderId: currentUserId,
        text: text || "",
        image: image || null,
        document: document || null
      });
      setChatHistory(prev => [...prev, res.data]);
      socket?.emit("stopTyping", { senderId: currentUserId, receiverId: id });
    } catch (err) { console.error("Send failed", err); }
  };

  const handleDelete = async (msgId) => {
    if (window.confirm("Delete this message for everyone?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/messages/${msgId}`);
        setChatHistory(prev => prev.map(m =>
          (m._id || m.id) === msgId
            ? { ...m, isDeleted: true, text: "🚫 This message was deleted", image: null, document: null }
            : m
        ));
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/messages/${currentUserId}/${id}`);
        setChatHistory(res.data);
        socket?.emit("markAsRead", { senderId: id, receiverId: currentUserId });
      } catch (err) { console.error("Fetch chat failed", err); }
    };
    if (id && currentUserId) fetchChat();
  }, [id, currentUserId, socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("newMessage", (msg) => {
      if (msg.senderId === currentUserId) return;

      const isRelevant = (msg.senderId === id && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === id);

      if (isRelevant) {
        setChatHistory(prev => {
          if (prev.find(m => (m._id || m.id) === (msg._id || msg.id))) return prev;
          return [...prev, msg];
        });
        if (msg.senderId === id) {
          socket.emit("markAsRead", { senderId: id, receiverId: currentUserId });
        }
      }
    });
    
    socket.on("messagesRead", ({ readerId }) => {
      if (readerId === id) {
        setChatHistory(prev => prev.map(m => m.senderId === currentUserId ? { ...m, status: 'read', isSeen: true } : m));
      }
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setChatHistory(prev => prev.map(m => (m._id || m.id) === messageId ? { ...m, text: "🚫 This message was deleted", isDeleted: true, image: null, document: null } : m));
    });

    socket.on("typing", ({ senderId }) => senderId === id && setIsPartnerTyping(true));
    socket.on("stopTyping", ({ senderId }) => senderId === id && setIsPartnerTyping(false));

    return () => {
      socket.off("newMessage");
      socket.off("messagesRead");
      socket.off("messageDeleted");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [id, socket, currentUserId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const renderMessages = () => {
    let lastDate = null;
    return chatHistory.map((msg, index) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      let dateHeader = null;
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        const label = msgDate === new Date().toDateString() ? "Today" : msgDate === new Date(Date.now() - 86400000).toDateString() ? "Yesterday" : msgDate;
        dateHeader = (
          <div key={`date-${msgDate}`} className="flex justify-center my-4">
            <span className="bg-black/40 text-white/70 text-[11px] px-3 py-1 rounded-md uppercase font-bold backdrop-blur-sm">{label}</span>
          </div>
        );
      }
      const isMe = msg.senderId === currentUserId;
      const renderTicks = () => {
        if (msg.status === 'read' || msg.isSeen) return <i className='bx bx-check-double text-cyan-400 text-base'></i>;
        if (msg.status === 'delivered') return <i className='bx bx-check-double text-white/40 text-base'></i>;
        return <i className='bx bx-check text-white/40 text-base'></i>;
      };

      return (
        <React.Fragment key={msg._id || index}>
          {dateHeader}
          <div className={`flex flex-col ${isMe ? 'items-end mb-2 mt-1' : 'items-start mb-05 mt-0.5'}`}>

            <div className={`group flex items-center gap-2 relative max-w-[85%] md:max-w-[70%]`}>

              {isMe && !msg.isDeleted && (
                <button
                  onClick={() => handleDelete(msg._id || msg.id)}
                  className="md:opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 p-1 transition-all"
                  title="Delete message"
                >
                  <i className='bx bx-trash text-lg'></i>
                </button>
              )}

              <div className={`p-2 rounded-xl shadow-sm w-full ${isMe ? 'bg-[#0f021a] text-white rounded-tr-none' : 'bg-[#202c33] text-white rounded-tl-none'}`}>
                
                {/* --- DOCUMENT ATTACHMENT BUBBLE --- */}
                {!msg.isDeleted && msg.document && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl mb-1 mt-1 border border-white/5 ${isMe ? 'bg-black/20' : 'bg-black/30'}`}>
                    
                    <div className={`p-3 rounded-lg ${msg.document.name.endsWith('.pdf') ? 'bg-rose-500/20 text-rose-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      <i className={`bx ${msg.document.name.endsWith('.pdf') ? 'bxs-file-pdf' : 'bxs-file-blank'} text-3xl`}></i>
                    </div>
                    
                    <div className="flex-1 overflow-hidden min-w-[120px]">
                      <p className="text-sm font-bold text-white truncate" title={msg.document.name}>
                        {msg.document.name}
                      </p>
                      <p className="text-[11px] text-white/50 uppercase font-bold tracking-wider mt-0.5">
                        {msg.document.size > 1024 * 1024 
                          ? (msg.document.size / (1024 * 1024)).toFixed(2) + ' MB' 
                          : (msg.document.size / 1024).toFixed(0) + ' KB'} 
                        {' • '} 
                        {msg.document.name.split('.').pop()}
                      </p>
                    </div>
                    
                    {isMe || downloadedMedia.includes(msg._id || msg.id) ? (
                      <button 
                        onClick={() => handleOpenDoc(msg.document)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors flex-shrink-0"
                        title="Open File"
                      >
                        <i className='bx bx-link-external text-xl'></i>
                      </button>
                    ) : (
                      <a 
                        href={msg.document.data} 
                        download={msg.document.name} 
                        onClick={() => markAsDownloaded(msg._id || msg.id)}
                        className="p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-full transition-colors flex-shrink-0"
                        title="Download File"
                      >
                        <i className='bx bx-download text-xl'></i>
                      </a>
                    )}
                  </div>
                )}

                {/* --- IMAGE ATTACHMENT BUBBLE --- */}
                {!msg.isDeleted && msg.image && (
                  <div className="relative rounded-lg mb-1 mt-1 overflow-hidden bg-black/20 flex items-center justify-center max-h-60 w-full">
                    <img 
                      src={msg.image} 
                      className={`w-full object-cover transition-all duration-300 ${
                        (!isMe && !downloadedMedia.includes(msg._id || msg.id)) 
                          ? 'blur-md opacity-60' 
                          : 'cursor-pointer'
                      }`} 
                      onClick={() => {
                        if (isMe || downloadedMedia.includes(msg._id || msg.id)) {
                          setSelectedImg(msg.image);
                        }
                      }} 
                      alt="Shared attachment" 
                    />
                    
                    {!isMe && !downloadedMedia.includes(msg._id || msg.id) && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center cursor-pointer z-10 hover:bg-black/10 transition-all"
                        onClick={() => markAsDownloaded(msg._id || msg.id)}
                      >
                        <div className="bg-black/60 p-3 rounded-full text-white backdrop-blur-md flex flex-col items-center justify-center shadow-xl hover:bg-cyan-500 hover:text-black transition-colors" title="Download Image">
                          <i className='bx bx-download text-2xl'></i>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-end gap-2 pr-1">
                  <p className={`text-[15px] leading-relaxed flex-1 ${msg.isDeleted ? 'italic opacity-50 text-[13px]' : ''}`}>{msg.text}</p>
                  <div className="flex items-center gap-1 pb-0.5">
                    <span className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                    {isMe && !msg.isDeleted && <span className="flex items-center">{renderTicks()}</span>}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  if (!activeUser) return <div className="h-screen w-full flex items-center justify-center text-white/20 uppercase tracking-widest font-black">User not found</div>;

  return (
    <div className="flex h-[100dvh] w-full bg-[#0b141a] overflow-hidden">
      <div className="hidden lg:block lg:w-[350px] xl:w-[400px] border-r border-white/5 h-full">
        <Users />
      </div>
      <div className="flex flex-col flex-1 h-full relative overflow-hidden border-l border-white/5">

        <header className="flex-shrink-0 h-16 px-3 md:px-4 flex items-center bg-[#121b22] border-b border-white/5 z-50">
          <button onClick={() => navigate('/')} className="lg:hidden text-white mr-2"><i className='bx bx-left-arrow-alt text-3xl'></i></button>

          <div className="flex items-center flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${activeUser._id}`)}>
            <img src={activeUser.profilepic} className="w-10 h-10 rounded-full border border-white/10 object-cover" alt="" />
            <div className="ml-3 truncate">
              <h2 className="text-white font-semibold text-[15px] truncate">{activeUser.name}</h2>
              <p className="text-[11px] uppercase tracking-wider">
                {isPartnerTyping ? <span className="text-emerald-400 font-bold lowercase">typing...</span> : <span className={isUserOnline ? 'text-emerald-500' : 'text-white/30'}>{isUserOnline ? 'Online' : 'Offline'}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => alert("Audio calls will be added next week!")} className="text-white/40 hover:text-cyan-400 p-2 transition-all" title="Audio Call">
              <i className='bx bxs-phone text-xl md:text-2xl'></i>
            </button>
            <button onClick={() => alert("Video calls will be added next week!")} className="text-white/40 hover:text-cyan-400 p-2 transition-all" title="Video Call">
              <i className='bx bxs-video text-xl md:text-2xl'></i>
            </button>
            <button
              onClick={() => setViewingAllMedia(true)}
              className="text-white/40 hover:text-cyan-400 p-2 transition-all relative group"
              title="Shared Media"
            >
              <i className='bx bx-images text-xl md:text-2xl'></i>
              {sharedMedia.length > 0 && (
                <span className="absolute top-1 right-1 bg-cyan-500 text-black text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#121b22]">
                  {sharedMedia.length}
                </span>
              )}
            </button>
            <button onClick={() => wallpaperInputRef.current.click()} className="text-white/40 hover:text-white p-2 transition-colors" title="Change Wallpaper">
              <i className='bx bx-image-add text-xl md:text-2xl'></i>
            </button>
            <input type="file" ref={wallpaperInputRef} hidden onChange={handleWallpaperChange} accept="image/*" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative" style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : 'url("https://w0.peakpx.com/wallpaper/580/650/wallpaper-whatsapp-dark-background.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
          <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
          <div className="relative z-10">{renderMessages()}<div ref={scrollRef} className="pb-2" /></div>
        </div>

        <footer className="flex-shrink-0 bg-[#121b22] border-t border-white/5 p-2 lg:p-4">
          <ChatInput
            onSend={handleSend}
            onImageSend={(img) => handleSend("", img)}
            onDocumentSend={(base64Data, fileName, fileType, fileSize) => {
              handleSend("", null, {
                data: base64Data,
                name: fileName,
                type: fileType,
                size: fileSize
              });
            }}
            onTyping={() => socket?.emit("typing", { senderId: currentUserId, receiverId: id })}
            onStopTyping={() => socket?.emit("stopTyping", { senderId: currentUserId, receiverId: id })}
          />
        </footer>
      </div>

      {viewingAllMedia && (
        <SharedMedia
          sharedMedia={sharedMedia}
          onClose={() => setViewingAllMedia(false)}
          selectedMsgs={selectedMsgs}
          toggleSelect={toggleSelect}
          setActiveIndex={setActiveImgIndex}
          onForward={() => setIsForwarding(true)}
          onOpenDoc={handleOpenDoc} /* PASSING THE PROP HERE */
        />
      )}

      {activeImgIndex !== null && (
        <ImageGallery
          images={sharedMedia.filter(msg => msg.image)} /* Only pass images to gallery */
          activeIndex={activeImgIndex}
          setActiveIndex={setActiveImgIndex}
          onClose={() => setActiveImgIndex(null)}
          onForward={(imgMsg) => { setSelectedMsgs([imgMsg]); setIsForwarding(true); }}
        />
      )}

      {isForwarding && (
        <ForwardModal
          users={forwardableUsers}
          onClose={() => { setIsForwarding(false); setSelectedMsgs([]); }}
          onConfirm={handleBulkForward}
          isProcessing={isProcessingForward}
        />
      )}

      {selectedImg && (
        <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default ChatDetail;