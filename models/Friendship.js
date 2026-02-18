import mongoose from 'mongoose';

const FriendshipSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'denied'], 
    default: 'pending' 
  }
}, { timestamps: true });

// This ensures A cannot request B if a record already exists
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const Friendship = mongoose.model('Friendship', FriendshipSchema);