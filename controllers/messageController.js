import Message from '../models/Message.js';
import { io, userSocketMap } from '../index.js'; 
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();
// --- getUserMessages ---
export const getUserMessages = async (req, res) => {
  try {
    const { myId, partnerId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: partnerId },
        { senderId: partnerId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { senderId: partnerId, receiverId: myId, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );

    // ✅ CLEAN FIX: Just use the IDs as Room names
    io.to(partnerId).emit('messagesRead', { readerId: myId, partnerId });
    io.to(myId).emit('selfMessagesRead', { partnerId });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
};

// --- deleteMessage ---
export const deleteMessage = async (req, res) => {
  try {
    // 1. Grab ID from URL params (supports either /:id or /:messageId in your routes file)
    const messageId = req.params.id || req.params.messageId;
    
    // 2. Grab the socket instance so 'io' works
    const io = req.app.get('socketio'); 

    // 3. Find the message first to automatically get the sender/receiver (Secure & Easy)
    const existingMessage = await Message.findById(messageId);
    if (!existingMessage) return res.status(404).json({ message: "Message not found" });

    // 4. Update it to be deleted
    const deletedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $set: { text: "🚫 This message was deleted", image: null, isDeleted: true } },
      { new: true }
    );

    const deletePayload = { 
      messageId: deletedMessage._id, 
      senderId: existingMessage.senderId, 
      receiverId: existingMessage.receiverId 
    };

    // 5. ✅ CLEAN FIX: Emit to User Rooms
    if (io) {
        io.to(existingMessage.receiverId.toString()).emit('messageDeleted', deletePayload);
        io.to(existingMessage.senderId.toString()).emit('messageDeleted', deletePayload);
    }

    res.status(200).json(deletedMessage);
  } catch (error) {
    res.status(500).json({ message: "Error deleting message" });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const sendMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { senderId, text, image, document } = req.body; 

    if (!text && !image && !document) {
      return res.status(400).json({ message: "Message must contain text, an image, or a document." });
    }

    let cloudImageUrl = null;
    let cloudDocument = null;

    // 1. IF THERE IS AN IMAGE: Upload to Cloudinary
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "spark_chat_images",
      });
      cloudImageUrl = uploadResponse.secure_url; // Grab the short URL!
    }

    // 2. IF THERE IS A DOCUMENT: Upload to Cloudinary
    if (document && document.data) {
      const uploadResponse = await cloudinary.uploader.upload(document.data, {
        folder: "spark_chat_docs",
        resource_type: "auto" // 'auto' tells Cloudinary to accept PDFs, Word docs, etc.
      });
      
      // Rebuild the document object, replacing the massive Base64 string with the URL
      cloudDocument = {
        data: uploadResponse.secure_url, 
        name: document.name,
        type: document.type,
        size: document.size
      };
    }

    // 3. SAVE TO MONGODB (Now it's lightweight!)
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: cloudImageUrl || null,
      document: cloudDocument || null 
    });

    await newMessage.save();

    // 4. EMIT SOCKET EVENT (If you have this set up)
    const io = req.app.get('socketio');
    if (io) {
      io.to(receiverId.toString()).emit('newMessage', newMessage);
      // Depending on your setup, you might not need to emit to senderId if React handles it, 
      // but it's safe to include if you use multiple devices.
    }

    res.status(201).json(newMessage);
    
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
};

// --- NEW: WhatsApp Style Delete ---
