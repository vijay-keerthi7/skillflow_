import Message from '../models/Message.js';

export const socketHandler = (io, userSocketMap) => {
    io.on('connection', (socket) => {
        let userId = socket.handshake.query.userId;
        
        if (userId && userId !== "undefined") {
            userId = userId.toString(); // Force string
            socket.join(userId);
            console.log(`User ${userId} joined room: ${userId}`);
            if (!userSocketMap[userId]) {
                userSocketMap[userId] = new Set();
            }
            userSocketMap[userId].add(socket.id);
        }
        
        // Broadcast online users (Get unique keys from map)
        io.emit("getOnlineUsers", Object.keys(userSocketMap));

        // --- Event Listeners ---

        socket.on("typing", ({ senderId, receiverId }) => {
            // Send to ALL devices of the receiver
            io.to(receiverId).emit("typing", { senderId });
        });

        socket.on("stopTyping", ({ senderId, receiverId }) => {
            io.to(receiverId).emit("stopTyping", { senderId });
        });

       socket.on("markAsRead", async ({ senderId, receiverId }) => {
    try {
        await Message.updateMany(
            { senderId, receiverId, status: { $ne: 'read' } },
            { $set: { status: 'read' } }
        );
        // senderId = the person who sent the msg (they need to see blue ticks)
        // receiverId = the person who is reading (they need to clear badges on other devices)
        io.to(senderId).emit("messagesRead", { readerId: receiverId, partnerId: senderId });
        io.to(receiverId).emit("selfMessagesRead", { partnerId: senderId });
    } catch (err) {
        console.error(err);
    }
});
        socket.on("updateProfile", (updatedUser) => {
            // Notify everyone else
            socket.broadcast.emit("userProfileUpdated", updatedUser);
            // Notify other devices of the SAME user to refresh local storage
            io.to(updatedUser._id).emit("refreshOwnProfile", updatedUser);
        });

        socket.on("deleteMessage", async ({ messageId, senderId, receiverId }) => {
            try {
                await Message.findByIdAndDelete(messageId);
                // Notify the receiver
                io.to(receiverId).emit("messageDeleted", { messageId, senderId, receiverId });
                // Notify ALL devices of the sender (including the one that didn't initiate delete)
                io.to(senderId).emit("messageDeleted", { messageId, senderId, receiverId });
            } catch (err) {
                console.error("Delete Error:", err);
            }
        });

        socket.on('disconnect', () => {
            if (userId && userSocketMap[userId]) {
                userSocketMap[userId].delete(socket.id);
                // Only delete the user from the map if NO sockets are left
                if (userSocketMap[userId].size === 0) {
                    delete userSocketMap[userId];
                }
                io.emit("getOnlineUsers", Object.keys(userSocketMap));
            }
        });
    });
};