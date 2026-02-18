import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import AttachmentMenu from './AttachmentMenu';

const ChatInput = ({ onSend, onImageSend, onDocumentSend, onTyping, onStopTyping }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    onTyping(); 

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1500);
  };

  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  // Automatically hide emoji picker when typing/keyboard opens
  const handleInputFocus = () => {
    setShowEmojiPicker(false);
  };

  // Toggle emoji picker & hide keyboard if opening
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (!showEmojiPicker) {
      inputRef.current?.blur(); // Closes the mobile keyboard
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    onSend(message);
    setMessage("");
    setShowEmojiPicker(false); // Close emojis on send
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onStopTyping();
  };

  // --- NEW: Document Upload Handler ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (e.g., limit to 5MB to prevent DB crashes)
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large! Please select a file under 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (onDocumentSend) {
          // ADDED file.size here!
          onDocumentSend(reader.result, file.name, file.type, file.size);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so you can upload the same file again if needed
    e.target.value = null; 
  };

  const isTypingText = message.length > 0;

  return (
    <div className="w-full p-2 bg-transparent relative"> 
      
      {showEmojiPicker && (
        <div className="absolute bottom-[100%] left-2 md:left-4 z-[9999] shadow-2xl rounded-xl overflow-hidden mb-2 border border-white/10">
          <EmojiPicker 
            onEmojiClick={onEmojiClick} theme="dark" 
            width={window.innerWidth < 640 ? window.innerWidth - 32 : 350} 
            height={window.innerWidth < 640 ? 300 : 400} lazyLoadEmojis={true}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto flex items-center gap-1 bg-white/10 backdrop-blur-2xl border border-white/20 p-1.5 rounded-2xl shadow-2xl relative">
        
        {/* ICONS HIDDEN WHEN TYPING */}
        {!isTypingText && (
          <>
            <button type="button" onClick={toggleEmojiPicker} className="text-2xl p-2 transition-colors flex-shrink-0 text-white/40 hover:text-white">
              <i className='bx bx-smile'></i>
            </button>
            <AttachmentMenu onImageSelect={onImageSend} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-white/40 hover:text-cyan-400 p-2 transition-colors flex-shrink-0">
              <i className='bx bx-paperclip text-2xl'></i>
            </button>
          </>
        )}
        
        <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.zip" />

        <input 
          ref={inputRef} type="text" value={message} 
          onChange={handleInputChange} onFocus={handleInputFocus}
          placeholder="Type a message..." 
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 text-[16px] md:text-sm py-2 px-2 min-w-0" 
        />

        {!isTypingText && (
          <div className="hidden sm:flex items-center gap-1 px-1 border-l border-white/10">
            <button type="button" className="text-white/40 hover:text-cyan-400 p-2"><i className='bx bx-microphone text-xl'></i></button>
          </div>
        )}

        <button 
          type="submit" disabled={!message.trim()}
          className={`p-2.5 rounded-xl transition-all shadow-lg active:scale-95 flex-shrink-0 ${!message.trim() ? 'bg-gray-500/20 text-white/20' : 'bg-cyan-500 hover:bg-cyan-400 text-white'}`}
        >
          <i className='bx bxs-send text-xl ml-0.5'></i>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;