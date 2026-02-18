import React, { createContext, useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";

export const usersContext = createContext();

const UsersProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [userData, setUserData] = useState(() => {
        const saved = localStorage.getItem('spark_user');
        return saved ? JSON.parse(saved) : null;
    });

    const socket = useRef(null);
    const currentUserId = userData?._id || userData?.id;

    const fetchEverything = useCallback(async () => {
        if (!currentUserId) return;
        try {
            const [meRes, usersRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/auth/me/${currentUserId}`),
                axios.get(`${process.env.REACT_APP_API_URL}/auth/all-users/${currentUserId}`),
            ]);
            setUserData(meRes.data);
            localStorage.setItem('spark_user', JSON.stringify(meRes.data));
            setUsers(usersRes.data);
            setLoading(false);
        } catch (err) { console.error("Fetch Error:", err); }
    }, [currentUserId]);

    const handleToggleFollow = async (targetId) => {
        try {
            // Optimistic UI Update for Users Array (Keeps Mutuals working)
            setUsers(prev => prev.map(u => {
                if (String(u._id) === String(targetId)) {
                    const isNowFollowing = !u.isFollowing;
                    let newFollowers = Array.isArray(u.followers) ? [...u.followers] : [];
                    
                    if (isNowFollowing) newFollowers.push(currentUserId);
                    else newFollowers = newFollowers.filter(id => String(id) !== String(currentUserId));

                    return { ...u, isFollowing: isNowFollowing, followers: newFollowers };
                }
                return u;
            }));

            // Optimistic Update for "My" UserData (Crucial for Mutuals logic)
            setUserData(prev => {
                if (!prev) return prev;
                let newFollowing = Array.isArray(prev.following) ? [...prev.following] : [];
                const isNowFollowing = !newFollowing.includes(targetId);
                
                if (isNowFollowing) newFollowing.push(targetId);
                else newFollowing = newFollowing.filter(id => String(id) !== String(targetId));
                
                return { ...prev, following: newFollowing };
            });

            await axios.post(`${process.env.REACT_APP_API_URL}/users/toggle-follow/${targetId}`, { myId: currentUserId });
        } catch (err) { fetchEverything(); }
    };

    useEffect(() => {
        if (currentUserId) fetchEverything();
    }, [currentUserId, fetchEverything]);

    useEffect(() => {
        if (!currentUserId || socket.current) return;

        const s = io(process.env.REACT_APP_SOCKET_URL, { 
            query: { userId: currentUserId },
            transports: ['polling', 'websocket']
        });
        socket.current = s;

        // --- NEW: Listen for Online Users ---
        s.on("getOnlineUsers", (ids) => setOnlineUsers(ids));

        s.on("countUpdate", (data) => {
            const { userId, followers, following } = Array.isArray(data) ? data[0] : data;
            setUsers(prev => prev.map(u => {
                if (String(u._id || u.id) === String(userId)) {
                    // Update counts without destroying the arrays
                    return { ...u, followersCount: followers, followingCount: following };
                }
                return u;
            }));
        });

        s.on("relationshipUpdated", (data) => {
            const { targetId, isFollowing } = Array.isArray(data) ? data[0] : data;
            setUsers(prev => prev.map(u => String(u._id) === String(targetId) ? { ...u, isFollowing } : u));
        });

        s.on("newNotification", (data) => {
            const payload = Array.isArray(data) ? data[0] : data;
            setNotifications(prev => [payload, ...prev]);
            
            // --- NEW: Play Notification Sound ---
            const audio = new Audio('/pop.mp3'); // Make sure pop.mp3 is in your public folder
            audio.play().catch(err => console.log("Browser blocked auto-play sound"));
        });

        return () => { s.disconnect(); socket.current = null; };
    }, [currentUserId]);

    return (
        <usersContext.Provider value={{ 
            users, setUsers, userData, loading, onlineUsers, 
            handleToggleFollow, notifications, socket: socket.current 
        }}>
            {children}
        </usersContext.Provider>
    );
};

export default UsersProvider;