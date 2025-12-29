import express from "express";
import {
    sendChannelMessage,
    togglePinMessage,
    deleteChannelMessage,
    toggleReaction,
    editChannelMessage,
    saveMessage,
    unsaveMessage,
    getSavedMessages,
    getConversation,
    sendDirectMessage,
    getConversations
} from "../controllers/message.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { uploadMultiple } from "../middlewares/multer.middleware.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// CHANNEL MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

// Send message to channel
router.post("/channel/:channelId", isAuthenticated, uploadMultiple, sendChannelMessage);

// Edit message
router.patch("/channel/:messageId", isAuthenticated, editChannelMessage);

// Pin/unpin message
router.patch("/pin/:messageId", isAuthenticated, togglePinMessage);

// Delete message
router.delete("/channel/:messageId", isAuthenticated, deleteChannelMessage);

// Toggle reaction on message
router.patch("/reaction/:messageId", isAuthenticated, toggleReaction);

// ═══════════════════════════════════════════════════════════════════════════
// SAVED MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

// Get all saved messages
router.get("/saved", isAuthenticated, getSavedMessages);

// Save/bookmark a message
router.post("/save/:messageId", isAuthenticated, saveMessage);

// Unsave a message
router.delete("/save/:messageId", isAuthenticated, unsaveMessage);

// ═══════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

// Get all conversations for current user
router.get("/dm/conversations", isAuthenticated, getConversations);

// Get conversation with specific user
router.get("/dm/:recipientId", isAuthenticated, getConversation);

// Send direct message
router.post("/dm/:recipientId", isAuthenticated, sendDirectMessage);

export default router;
