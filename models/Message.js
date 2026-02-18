import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
 text: { type: String, default: "" }, // Not required, defaults to empty string
  image: { type: String, default: null }, // Store Base64 string or Cloudinary URL,

document: { 
    data: { type: String }, // The base64 file string
    name: { type: String }, // e.g., "Resume.pdf"
    type: { type: String }, // e.g., "application/pdf"
    size: { type: Number }  // File size in bytes
  },

  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  isDeleted: { type: Boolean, default: false }, // Add this!
  time: { 
    type: String, 
    default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
  }
}, { timestamps: true }); // This automatically adds 'createdAt' and 'updatedAt'


// CORRECTED VALIDATOR: No 'next' parameter needed for modern Mongoose sync validation
messageSchema.pre('validate', function() {
  if (!this.text?.trim() && !this.image != null && !this.document?.data) {
    throw new Error('Message must contain either text or an image.');
  }
});


const Message = mongoose.model('Message', messageSchema);
export default Message;