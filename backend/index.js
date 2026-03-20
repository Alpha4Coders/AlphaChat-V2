import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import configurePassport from "./config/passport.js";
import { DEFAULT_CHANNELS } from "./config/teams.config.js";

import authRouter from "./routes/auth.routes.js";
import channelRouter from "./routes/channel.routes.js";
import messageRouter from "./routes/message.routes.js";
import userRouter from "./routes/user.routes.js";

import User from "./models/user.model.js";
import Channel from "./models/channel.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

// ─── CORS ────────────────────────────────────────────────────────────────────

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://alpha-chat-v2.vercel.app",
    "https://alphachat-v2.onrender.com",
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin not allowed — ${origin}`));
    },
    credentials: true,
}));

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(express.json());
app.use(cookieParser());

if (isProduction) app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET || "alpha-chats-v2-secret",
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
}));

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────

const io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true },
});

const onlineUsers = new Map();
const typingUsers = new Map();

app.use((req, _res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    next();
});

io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    socket.on("join", async (userId) => {
        // Disconnect any duplicate session for this user
        const existing = [...onlineUsers.entries()].find(([id]) => id === userId);
        if (existing) {
            io.sockets.sockets.get(existing[1].socketId)?.disconnect(true);
            onlineUsers.delete(userId);
        }

        onlineUsers.set(userId, { socketId: socket.id, status: "online", joinedAt: new Date() });

        try {
            await User.findByIdAndUpdate(userId, { status: "online", isOnline: true, lastSeen: new Date() });
        } catch (err) {
            console.error("Failed to update user status:", err.message);
        }

        io.emit("onlineUsers", { users: [...onlineUsers.keys()], count: onlineUsers.size });
        console.log(`✅ ${userId} joined. Online: ${onlineUsers.size}`);
    });

    socket.on("joinChannel", (channelId) => socket.join(`channel:${channelId}`));
    socket.on("leaveChannel", (channelId) => socket.leave(`channel:${channelId}`));

    socket.on("channelMessage", ({ channelId, message, senderId }) => {
        typingUsers.delete(senderId);
        socket.to(`channel:${channelId}`).emit("channelMessage", { channelId, message });
    });

    socket.on("directMessage", ({ recipientId, message, senderId }) => {
        const recipient = [...onlineUsers.entries()].find(([id]) => id === recipientId);
        if (!recipient) return;

        io.to(recipient[1].socketId).emit("directMessage", { message, senderId });
        socket.emit("messageDelivered", { messageId: message._id, recipientId });
    });

    socket.on("typing", ({ channelId, recipientId, senderId, isTyping, senderName }) => {
        isTyping
            ? typingUsers.set(senderId, { channelId: channelId ?? null, recipientId: recipientId ?? null })
            : typingUsers.delete(senderId);

        const payload = { userId: senderId, userName: senderName, isTyping };

        if (channelId) {
            socket.to(`channel:${channelId}`).emit("userTyping", { ...payload, channelId });
        } else if (recipientId) {
            const recipient = [...onlineUsers.entries()].find(([id]) => id === recipientId);
            if (recipient) io.to(recipient[1].socketId).emit("userTyping", payload);
        }
    });

    socket.on("markAsRead", ({ messageIds, senderId, channelId }) => {
        const sender = [...onlineUsers.entries()].find(([id]) => id === senderId);
        if (sender) io.to(sender[1].socketId).emit("messagesRead", { messageIds, channelId });
    });

    socket.on("disconnect", async () => {
        const entry = [...onlineUsers.entries()].find(([, data]) => data.socketId === socket.id);
        if (!entry) return;

        const [userId] = entry;

        try {
            await User.findByIdAndUpdate(userId, { status: "offline", isOnline: false, lastSeen: new Date() });
        } catch (err) {
            console.error("Failed to update offline status:", err.message);
        }

        typingUsers.delete(userId);
        onlineUsers.delete(userId);

        io.emit("onlineUsers", { users: [...onlineUsers.keys()], count: onlineUsers.size });
        io.emit("userStatusUpdate", { userId, status: "offline", lastSeen: new Date() });
        console.log(`❌ ${userId} disconnected. Online: ${onlineUsers.size}`);
    });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.use("/api/auth", authRouter);
app.use("/api/channels", channelRouter);
app.use("/api/messages", messageRouter);
app.use("/api/users", userRouter);

app.get("/api/health", (_req, res) => res.json({ success: true, message: "Alpha Chats V2 is running", version: "2.0.0" }));

// ─── STARTUP ──────────────────────────────────────────────────────────────────

const seedDefaultChannels = async () => {
    for (const channelData of DEFAULT_CHANNELS) {
        const exists = await Channel.findOne({ slug: channelData.slug });
        if (!exists) {
            await Channel.create({ ...channelData, isDefault: true });
            console.log(`📢 Created channel: ${channelData.name}`);
        }
    }
    console.log("✅ Default channels initialized");
};

connectDB()
    .then(async () => {
        await seedDefaultChannels();
        server.listen(PORT, () => {
            console.log(`\n🚀 Alpha Chats V2 running on port ${PORT}\n`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1);
    });

export { io, onlineUsers };
