import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, 
    required: function() { return !this.googleId } 
  },
  googleId: { type: String }, 
  profilepic: { type: String, default: "/download.png" },
  isProfileComplete: { type: Boolean, default: false },
  status: { type: String, enum: ['online', 'offline'], default: "offline" },
  // Ensure this is strictly a Date
  lastseen: { type: Date, default: Date.now }, 
  bio: { type: String, default: "Hey there! I'm using SkillFlow." },
  accountType: { type: String, enum: ['public', 'private'], default: 'public' },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Pre-save middleware to catch the "Just now" string if it ever tries to enter the DB again
userSchema.pre('save', function(next) {
  if (typeof this.lastseen === 'string') {
    this.lastseen = new Date();
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;