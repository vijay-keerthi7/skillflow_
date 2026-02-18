import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usersContext } from '../context/UsersContext';

export const useChatLogic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, setUsers, onlineUsers, socket } = useContext(usersContext);
  
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isProcessingForward, setIsProcessingForward] = useState(false);
  const typingTimeoutRef = useRef(null);
  const scrollRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('spark_user'));
  const currentUserId = currentUser?._id || currentUser?.id;
  const activeUser = users?.find((u) => u._id === id);
  const isUserOnline = onlineUsers?.includes(activeUser?._id);

  // Fetch Messages
  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/messages/${currentUserId}/${id}`);
        setChatHistory(res.data);
        if (socket) {
          socket.emit("markAsRead", { senderId: id, receiverId: currentUserId });
          setUsers(prev => prev.map(u => u._id === id ? { ...u, unreadCount: 0 } : u));
        }
      } catch (err) { console.error(err); }
    };
    if (id && currentUserId) getMessages();
  }, [id, currentUserId, socket]);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      if ((msg.senderId === id && msg.receiverId === currentUserId) || (msg.senderId === currentUserId && msg.receiverId === id)) {
        setChatHistory(prev => [...prev, msg]);
      }
    };
    socket.on("newMessage", handleNewMessage);
    socket.on("typing", ({ senderId }) => senderId === id && setIsPartnerTyping(true));
    socket.on("stopTyping", ({ senderId }) => senderId === id && setIsPartnerTyping(false));
    return () => {
      socket.off("newMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [id, socket, currentUserId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  return {
    id, navigate, activeUser, isUserOnline, message, setMessage, chatHistory, setChatHistory,
    isPartnerTyping, isProcessingForward, setIsProcessingForward, scrollRef, currentUserId, socket, users
  };
};