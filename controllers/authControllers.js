import User from '../models/User.js';
import bcrypt from 'bcryptjs'; // To hide passwords safely
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import passport from 'passport';
import { generateToken } from '../utils/generateToken.js';
import { io } from '../index.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1. Find user
    const user = await User.findOne({ email: email });

    if (!user) return res.status(400).json({ message: "Invalid Email" });
    // 2. Compare Password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: "Invalid Email or Password" });

    // CREATE TOKEN
    // 'process.env.JWT_SECRET' is a random string you add to your .env file
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, profilepic: user.profilepic }
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed here" });
  }
};




export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // 2. Hash the password (never store plain text!)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create and save user
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getAllUsers = async (req, res) => {
  try {
    const { myId } = req.params;

    // 1. Fetch all users except yourself
    const users = await User.find({ _id: { $ne: myId } }).select('-password');

    // 2. Map through users to find relationship data
    const usersWithMeta = await Promise.all(
      users.map(async (user) => {
        // Find the most recent message between you and this user
        const lastMsg = await Message.findOne({
          $or: [
            { senderId: myId, receiverId: user._id },
            { senderId: user._id, receiverId: myId }
          ]
        }).sort({ createdAt: -1 });

        // Count unread messages sent BY this user TO you
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: myId,
          status: { $ne: 'read' }
        });

        return {
          ...user._doc, // Spreads original user data
          lastMessage: lastMsg ? lastMsg.text : "No messages yet",
          lastMessageTime: lastMsg ? lastMsg.createdAt : null,
          unreadCount: unreadCount
        };
      })
    );

    // 3. Sort by lastMessageTime (Newest chats at the top)
    usersWithMeta.sort((a, b) => {
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
    res.status(200).json(usersWithMeta);
  } catch (error) {
    console.error("Error fetching users with meta:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};




// routes/authRoutes.js
export const updateProfile = async (req, res) => {
  try {
    const { userId, name, profilepic, bio } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { name, profilepic, bio }, 
      { new: true }
    ).select('-password');

    // UNIVERSAL SYNC LOGIC:
    // 1. Tell the user's OTHER devices to update their "Me" profile
    io.to(userId.toString()).emit("refreshOwnProfile", updatedUser);

    // 2. Tell EVERYONE ELSE that this user's info changed (for the chat list)
    io.emit("userProfileUpdated", updatedUser);

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching self" });
  }
};

// Change this in your authControllers.js
export const googleLoginTrigger = (req, res, next) => {
  // We don't use try/catch here because passport handles it
  // and we MUST pass (req, res, next) at the end
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect('http://localhost:3000/auth?error=google_failed');
    }

    // Use your existing JWT logic
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Prepare user data to send to frontend (omit the password!)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilepic: user.profilepic,
      isProfileComplete: user.isProfileComplete
    };

    // Redirect to frontend with token and user data in URL
    const query = `token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
    res.redirect(`http://localhost:3000/login-success?${query}`);
  })(req, res, next);
};


export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email profilepic bio status lastseen');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};