import React from 'react';

const MessageBubble = ({ msg, isMe, isProcessingForward, getTickIcon, onDelete }) => {
  return (
    <div onContextMenu={(e) => { if (isMe) { e.preventDefault(); onDelete(msg._id || msg.id); } }} 
      className={`max-w-[85%] md:max-w-[70%] shadow-sm w-fit flex flex-col backdrop-blur-sm border transition-all duration-300 relative group rounded-xl 
      ${isMe ? 'bg-cyan-600/30 border-white/10 rounded-tr-none ml-auto text-white' : 'bg-white/10 border-white/5 rounded-tl-none text-white'} 
      ${msg.image ? 'p-1' : 'p-1.5 px-2.5'}`}>
      
      {msg.image ? (
        <div className="relative group/img overflow-hidden rounded-lg">
          <img src={msg.image} alt="attachment" 
            className={`max-w-full max-h-72 object-cover rounded-lg block transition-all duration-500
            ${isProcessingForward ? 'blur-md grayscale opacity-50' : 'hover:scale-[1.02]'}`} 
          />
          {isProcessingForward && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : <p className="text-[14px] break-words">{msg.text}</p>}
      
      <div className="flex items-center gap-1 ml-auto pt-1">
        <span className="text-[9px] text-white/40">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {isMe && getTickIcon(msg)}
      </div>
    </div>
  );
};
export default MessageBubble;