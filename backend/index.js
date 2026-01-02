import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import http from "http";
import { Server } from "socket.io";

// Config imports
import connectDB from "./config/db.js";
import configurePassport from "./config/passport.js";
import { DEFAULT_CHANNELS } from "./config/teams.config.js";

// Route imports
import authRouter from "./routes/auth.routes.js";
import channelRouter from "./routes/channel.routes.js";
import messageRouter from "./routes/message.routes.js";
import userRouter from "./routes/user.routes.js";

// Model imports
import User from "./models/user.model.js";
import Channel from "./models/channel.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

// ═══════════════════════════════════════════════════════════════════════════
// SOCKET.IO SETUP
// ═══════════════════════════════════════════════════════════════════════════
// Build allowed origins list early for both Express and Socket.IO
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5000",
    process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]
            : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Online users tracking
const onlineUsers = new Map();
const typingUsers = new Map();

// Add explicit production URLs to ensure they're always allowed
const productionOrigins = [
    "https://alphachat-v2.vercel.app",
    "https://alphachat-v2-backend.onrender.com"
];

const finalAllowedOrigins = [...new Set([...allowedOrigins, ...productionOrigins])];
console.log("CORS allowed origins:", finalAllowedOrigins);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (finalAllowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Allow but log for debugging (shouldn't happen in production)
            console.log("CORS: Allowing unlisted origin:", origin);
            callback(null, true);
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    secret: process.env.SESSION_SECRET || 'alpha-chats-v2-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,  // HTTPS only in production
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',  // 'none' required for cross-site cookies
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    // Trust first proxy (Render)
    proxy: isProduction
}));

// Trust proxy for secure cookies behind Render's load balancer
if (isProduction) {
    app.set('trust proxy', 1);
}

// Initialize Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Inject io and onlineUsers to requests
app.use((req, res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    next();
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.use("/api/auth", authRouter);
app.use("/api/channels", channelRouter);
app.use("/api/messages", messageRouter);
app.use("/api/users", userRouter);

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Alpha Chats V2 API is running",
        version: "2.0.0"
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SOCKET.IO EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // User joins (after authentication)
    socket.on('join', async (userId) => {
        // Remove existing connection for same user
        const existingConnection = Array.from(onlineUsers.entries())
            .find(([uId]) => uId === userId);

        if (existingConnection) {
            const oldSocketId = existingConnection[1].socketId;
            const oldSocket = io.sockets.sockets.get(oldSocketId);
            if (oldSocket) oldSocket.disconnect(true);
            onlineUsers.delete(userId);
        }

        onlineUsers.set(userId, {
            socketId: socket.id,
            status: 'online',
            joinedAt: new Date()
        });

        // Update user status in database
        try {
            await User.findByIdAndUpdate(userId, {
                status: 'online',
                isOnline: true,
                lastSeen: new Date()
            });
        } catch (error) {
            console.error("Failed to update user status:", error);
        }

        // Broadcast online users
        io.emit('onlineUsers', {
            users: Array.from(onlineUsers.keys()),
            count: onlineUsers.size
        });

        console.log(`✅ User ${userId} joined. Online: ${onlineUsers.size}`);
    });

    // Join a channel room
    socket.on('joinChannel', (channelId) => {
        socket.join(`channel:${channelId}`);
        console.log(`👥 Socket ${socket.id} joined channel:${channelId}`);
    });

    // Leave a channel room
    socket.on('leaveChannel', (channelId) => {
        socket.leave(`channel:${channelId}`);
        console.log(`👋 Socket ${socket.id} left channel:${channelId}`);
    });

    // Channel message (real-time delivery)
    socket.on('channelMessage', (data) => {
        const { channelId, message, senderId } = data;

        // Clear typing status
        typingUsers.delete(senderId);

        // Broadcast to all in channel except sender
        socket.to(`channel:${channelId}`).emit('channelMessage', {
            channelId,
            message
        });
    });

    // Direct message (real-time delivery)
    socket.on('directMessage', (data) => {
        const { recipientId, message, senderId } = data;

        const recipient = Array.from(onlineUsers.entries())
            .find(([uId]) => uId === recipientId);

        if (recipient) {
            io.to(recipient[1].socketId).emit('directMessage', {
                message,
                senderId
            });

            // Send delivery confirmation
            socket.emit('messageDelivered', {
                messageId: message._id,
                recipientId
            });
        }
    });

    // Typing indicators
    socket.on('typing', (data) => {
        const { channelId, recipientId, senderId, isTyping, senderName } = data;

        if (isTyping) {
            typingUsers.set(senderId, {
                channelId: channelId || null,
                recipientId: recipientId || null
            });
        } else {
            typingUsers.delete(senderId);
        }

        if (channelId) {
            // Channel typing
            socket.to(`channel:${channelId}`).emit('userTyping', {
                userId: senderId,
                userName: senderName,
                isTyping,
                channelId
            });
        } else if (recipientId) {
            // DM typing
            const recipient = Array.from(onlineUsers.entries())
                .find(([uId]) => uId === recipientId);

            if (recipient) {
                io.to(recipient[1].socketId).emit('userTyping', {
                    userId: senderId,
                    userName: senderName,
                    isTyping
                });
            }
        }
    });

    // Mark messages as read
    socket.on('markAsRead', (data) => {
        const { messageIds, senderId, channelId } = data;

        const sender = Array.from(onlineUsers.entries())
            .find(([uId]) => uId === senderId);

        if (sender) {
            io.to(sender[1].socketId).emit('messagesRead', {
                messageIds,
                channelId
            });
        }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
        const userEntry = Array.from(onlineUsers.entries())
            .find(([, userData]) => userData.socketId === socket.id);

        if (userEntry) {
            const [userId] = userEntry;

            // Update database
            try {
                await User.findByIdAndUpdate(userId, {
                    status: 'offline',
                    isOnline: false,
                    lastSeen: new Date()
                });
            } catch (error) {
                console.error("Failed to update user offline status:", error);
            }

            // Clean up
            typingUsers.delete(userId);
            onlineUsers.delete(userId);

            // Broadcast updated online users
            io.emit('onlineUsers', {
                users: Array.from(onlineUsers.keys()),
                count: onlineUsers.size
            });

            io.emit('userStatusUpdate', {
                userId,
                status: 'offline',
                lastSeen: new Date()
            });

            console.log(`❌ User ${userId} disconnected. Online: ${onlineUsers.size}`);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const seedDefaultChannels = async () => {
    try {
        for (const channelData of DEFAULT_CHANNELS) {
            const exists = await Channel.findOne({ slug: channelData.slug });

            if (!exists) {
                await Channel.create({
                    ...channelData,
                    isDefault: true
                });
                console.log(`📢 Created channel: ${channelData.name}`);
            }
        }
        console.log("✅ Default channels initialized");
    } catch (error) {
        console.error("❌ Failed to seed channels:", error);
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

connectDB().then(async () => {
    // Seed default channels on startup
    await seedDefaultChannels();

    server.listen(port, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 ALPHA CHATS V2 SERVER RUNNING                           ║
║                                                               ║
║   🌐 API:      http://localhost:${port}                        ║
║   🔌 Socket:   ws://localhost:${port}                          ║
║   📊 Health:   http://localhost:${port}/api/health             ║
║                                                               ║
║   🔐 GitHub OAuth Enabled                                     ║
║   📢 ${DEFAULT_CHANNELS.length} Default Channels Configured                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
    });
}).catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
});

export { io, onlineUsers };
