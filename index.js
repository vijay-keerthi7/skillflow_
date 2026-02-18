import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { socketHandler } from './sockethandler/socketHandler.js';
import User from './models/User.js';
// Route Imports
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import Message from './models/Message.js';
import userRoutes from './routes/userRoutes.js';

import { DB_Connection } from './config/DB_Config.js';

// --- ES MODULE FIX FOR __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

import passport from 'passport';
import './config/passport_config.js';

// --- 1. MIDDLEWARE & DYNAMIC CORS ---
const allowedOrigins = [
  // "https://whatsap2-fwagd4daahanfqaw.ukwest-01.azurewebsites.net",
  "http://localhost:3000",              // ✅ ADDED (for laptop testing)
  "http://192.168.29.193:3000"          // existing
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // ✅ ADDED: allow LAN IP variations (mobile browsers sometimes change origin format)
    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith("http://192.168.29.193")
    ) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. SOCKET SETUP & USER TRACKING ---
const userSocketMap = {}; 
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.29.193:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.set('socketio', io);
socketHandler(io, userSocketMap);
//export { io, userSocketMap };

DB_Connection();

// --- 5. ROUTES ---
app.use(passport.initialize());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Use a single, clear static directory pointer
const buildPath = path.join(__dirname, 'frontend', 'build');
app.use(express.static(buildPath));

app.get('/', async (req, res, next) => {
  try {
    const users = await User.find({}); 
    console.log("Fetched users:", users);
    res.status(200).json(users); 
  } catch (error) {
    next(error); 
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// app.get('/*path', (req, res) => { 
//   res.sendFile(path.join(buildPath, 'index.html'));
// });



// --- 7. SERVER START ---
const PORT = process.env.PORT || 5000; 
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

export {io, userSocketMap};
