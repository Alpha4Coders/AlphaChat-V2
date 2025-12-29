import ChannelMessage from "../models/channelMessage.model.js";
import DirectMessage from "../models/directMessage.model.js";
import Conversation from "../models/conversation.model.js";
import Channel from "../models/channel.model.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

// ═══════════════════════════════════════════════════════════════════════════
// CHANNEL MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

// Send message to channel
export const sendChannelMessage = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { content, messageType, codeLanguage, replyTo } = req.body;
        const sender = req.user._id;

        // Check if user is member of channel
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: "Channel not found" });
        }

        // Co-founders and core team can always send
        const canSend = req.user.role === 'cofounder' ||
            req.user.role === 'core' ||
            channel.members.includes(sender);

        if (!canSend) {
            return res.status(403).json({
                success: false,
                message: "Join the channel to send messages"
            });
        }

        // Handle file uploads if any
        let files = [];
        let imageUrl = "";

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload_stream({
                    resource_type: 'auto',
                    folder: 'alpha-chats-v2/channels'
                }, (error, result) => {
                    if (error) throw error;
                    return result;
                });

                files.push({
                    name: file.originalname,
                    url: result.secure_url,
                    size: file.size,
                    type: file.mimetype
                });

                if (file.mimetype.startsWith('image/')) {
                    imageUrl = result.secure_url;
                }
            }
        }

        // Create message
        const message = await ChannelMessage.create({
            channel: channelId,
            sender,
            content,
            messageType: messageType || 'text',
            codeLanguage: codeLanguage || '',
            files,
            imageUrl,
            replyTo: replyTo || null
        });

        // Update channel stats
        await Channel.findByIdAndUpdate(channelId, {
            $inc: { messageCount: 1 },
            lastActivity: new Date()
        });

        // Populate sender info for response
        await message.populate('sender', 'username displayName avatar role');
        if (message.replyTo) {
            await message.populate({
                path: 'replyTo',
                populate: { path: 'sender', select: 'username displayName avatar' }
            });
        }

        // Emit via Socket.IO (handled in main server)
        if (req.io) {
            req.io.to(`channel:${channelId}`).emit('channelMessage', {
                channelId,
                message
            });
        }

        res.status(201).json({
            success: true,
            message
        });
    } catch (error) {
        console.error("Send channel message error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
};

// Pin/unpin message (admin only)
export const togglePinMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await ChannelMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Check if user has admin rights
        const channel = await Channel.findById(message.channel);
        const isAdmin = channel.admins.includes(req.user._id) || req.user.role === 'cofounder';

        if (!isAdmin) {
            return res.status(403).json({ success: false, message: "Admin privileges required" });
        }

        // Toggle pin status
        message.isPinned = !message.isPinned;
        await message.save();

        // Update channel's pinned messages
        if (message.isPinned) {
            await Channel.findByIdAndUpdate(message.channel, {
                $addToSet: { pinnedMessages: messageId }
            });
        } else {
            await Channel.findByIdAndUpdate(message.channel, {
                $pull: { pinnedMessages: messageId }
            });
        }

        res.json({
            success: true,
            message: message.isPinned ? "Message pinned" : "Message unpinned",
            isPinned: message.isPinned
        });
    } catch (error) {
        console.error("Toggle pin error:", error);
        res.status(500).json({ success: false, message: "Failed to toggle pin" });
    }
};

// Delete message (admin or sender)
export const deleteChannelMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await ChannelMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Check permissions
        const channel = await Channel.findById(message.channel);
        const isAdmin = channel.admins.includes(req.user._id) || req.user.role === 'cofounder';
        const isSender = message.sender.equals(req.user._id);

        if (!isAdmin && !isSender) {
            return res.status(403).json({ success: false, message: "Cannot delete this message" });
        }

        // Soft delete
        message.isDeleted = true;
        message.content = "[Message deleted]";
        await message.save();

        res.json({
            success: true,
            message: "Message deleted"
        });
    } catch (error) {
        console.error("Delete message error:", error);
        res.status(500).json({ success: false, message: "Failed to delete message" });
    }
};

// Toggle reaction on message
export const toggleReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji, messageType } = req.body; // messageType: 'channel' or 'dm'
        const userId = req.user._id;

        if (!emoji) {
            return res.status(400).json({ success: false, message: "Emoji is required" });
        }

        // Find the message based on type
        const MessageModel = messageType === 'dm' ? DirectMessage : ChannelMessage;
        const message = await MessageModel.findById(messageId);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Initialize reactions if not exists
        if (!message.reactions) {
            message.reactions = new Map();
        }

        // Get current users who reacted with this emoji
        const currentReactions = message.reactions.get(emoji) || [];
        const userIndex = currentReactions.findIndex(id => id.equals(userId));

        if (userIndex > -1) {
            // User already reacted, remove reaction
            currentReactions.splice(userIndex, 1);
            if (currentReactions.length === 0) {
                message.reactions.delete(emoji);
            } else {
                message.reactions.set(emoji, currentReactions);
            }
        } else {
            // Add reaction
            currentReactions.push(userId);
            message.reactions.set(emoji, currentReactions);
        }

        await message.save();

        // Convert reactions Map to object for response
        const reactionsObj = {};
        if (message.reactions) {
            message.reactions.forEach((users, key) => {
                reactionsObj[key] = users;
            });
        }

        // Emit via Socket.IO for real-time updates
        if (req.io && messageType === 'channel') {
            req.io.to(`channel:${message.channel}`).emit('messageReaction', {
                messageId,
                reactions: reactionsObj,
                emoji,
                userId: userId.toString(),
                action: userIndex > -1 ? 'removed' : 'added'
            });
        }

        res.json({
            success: true,
            reactions: reactionsObj,
            action: userIndex > -1 ? 'removed' : 'added'
        });
    } catch (error) {
        console.error("Toggle reaction error:", error);
        res.status(500).json({ success: false, message: "Failed to toggle reaction" });
    }
};

// Edit channel message (sender only or admin)
export const editChannelMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: "Content is required" });
        }

        const message = await ChannelMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (message.isDeleted) {
            return res.status(400).json({ success: false, message: "Cannot edit deleted message" });
        }

        // Check permissions - only sender can edit
        const isSender = message.sender.equals(req.user._id);

        if (!isSender) {
            return res.status(403).json({ success: false, message: "Only message sender can edit" });
        }

        // Update message
        message.content = content.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        // Populate for response
        await message.populate('sender', 'username displayName avatar role');

        // Emit via Socket.IO
        if (req.io) {
            req.io.to(`channel:${message.channel}`).emit('messageEdited', {
                messageId,
                message
            });
        }

        res.json({
            success: true,
            message
        });
    } catch (error) {
        console.error("Edit message error:", error);
        res.status(500).json({ success: false, message: "Failed to edit message" });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// SAVED MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

// Save/bookmark a message
export const saveMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { messageType } = req.body; // 'channel' or 'dm'
        const userId = req.user._id;

        // Verify message exists
        const MessageModel = messageType === 'dm' ? DirectMessage : ChannelMessage;
        const message = await MessageModel.findById(messageId);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Check if already saved
        const user = await User.findById(userId);
        const alreadySaved = user.savedMessages.some(
            sm => sm.messageId.equals(messageId)
        );

        if (alreadySaved) {
            return res.status(400).json({ success: false, message: "Message already saved" });
        }

        // Add to saved messages
        user.savedMessages.push({
            messageId,
            messageType: messageType || 'channel',
            savedAt: new Date()
        });
        await user.save();

        res.json({
            success: true,
            message: "Message saved"
        });
    } catch (error) {
        console.error("Save message error:", error);
        res.status(500).json({ success: false, message: "Failed to save message" });
    }
};

// Unsave a message
export const unsaveMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);
        const initialLength = user.savedMessages.length;

        user.savedMessages = user.savedMessages.filter(
            sm => !sm.messageId.equals(messageId)
        );

        if (user.savedMessages.length === initialLength) {
            return res.status(404).json({ success: false, message: "Message not in saved list" });
        }

        await user.save();

        res.json({
            success: true,
            message: "Message unsaved"
        });
    } catch (error) {
        console.error("Unsave message error:", error);
        res.status(500).json({ success: false, message: "Failed to unsave message" });
    }
};

// Get all saved messages
export const getSavedMessages = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        const savedMessages = [];

        for (const saved of user.savedMessages) {
            const MessageModel = saved.messageType === 'dm' ? DirectMessage : ChannelMessage;
            const message = await MessageModel.findById(saved.messageId)
                .populate('sender', 'username displayName avatar role');

            if (message && !message.isDeleted) {
                savedMessages.push({
                    ...message.toObject(),
                    savedAt: saved.savedAt,
                    messageType: saved.messageType
                });
            }
        }

        // Sort by savedAt descending (newest first)
        savedMessages.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

        res.json({
            success: true,
            savedMessages
        });
    } catch (error) {
        console.error("Get saved messages error:", error);
        res.status(500).json({ success: false, message: "Failed to get saved messages" });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

// Get or create conversation with a user
export const getConversation = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const userId = req.user._id;

        // Find existing conversation or create new
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, recipientId] }
        }).populate('participants', 'username displayName avatar isOnline lastSeen')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'username displayName avatar' }
            });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, recipientId]
            });
            await conversation.populate('participants', 'username displayName avatar isOnline lastSeen');
        }

        // Get messages with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await DirectMessage.find({
            conversation: conversation._id,
            isDeleted: false
        })
            .populate('sender', 'username displayName avatar')
            .populate({
                path: 'replyTo',
                populate: { path: 'sender', select: 'username displayName avatar' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalMessages = await DirectMessage.countDocuments({
            conversation: conversation._id,
            isDeleted: false
        });

        // Mark messages as read
        await DirectMessage.updateMany(
            { conversation: conversation._id, receiver: userId, read: false },
            { read: true, readAt: new Date() }
        );

        // Reset unread count for this user
        conversation.unreadCount.set(userId.toString(), 0);
        await conversation.save();

        res.json({
            success: true,
            conversation,
            messages: messages.reverse(),
            pagination: {
                page,
                limit,
                total: totalMessages,
                hasMore: skip + messages.length < totalMessages
            }
        });
    } catch (error) {
        console.error("Get conversation error:", error);
        res.status(500).json({ success: false, message: "Failed to get conversation" });
    }
};

// Send direct message
export const sendDirectMessage = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const { content, messageType, codeLanguage, replyTo } = req.body;
        const senderId = req.user._id;

        // Get or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, recipientId]
            });
        }

        // Create message
        const message = await DirectMessage.create({
            sender: senderId,
            receiver: recipientId,
            conversation: conversation._id,
            content,
            messageType: messageType || 'text',
            codeLanguage: codeLanguage || '',
            replyTo: replyTo || null
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastActivity = new Date();

        // Increment unread count for recipient
        const currentUnread = conversation.unreadCount.get(recipientId.toString()) || 0;
        conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
        await conversation.save();

        await message.populate('sender', 'username displayName avatar');

        // Emit via Socket.IO
        if (req.io && req.onlineUsers) {
            const recipient = Array.from(req.onlineUsers.entries())
                .find(([uId]) => uId === recipientId.toString());

            if (recipient) {
                req.io.to(recipient[1].socketId).emit('directMessage', {
                    conversationId: conversation._id,
                    message
                });
            }
        }

        res.status(201).json({
            success: true,
            message
        });
    } catch (error) {
        console.error("Send DM error:", error);
        res.status(500).json({ success: false, message: "Failed to send message" });
    }
};

// Get all conversations for current user
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'username displayName avatar isOnline lastSeen')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'username displayName avatar' }
            })
            .sort({ lastActivity: -1 });

        // Add unread count for current user
        const conversationsWithUnread = conversations.map(conv => ({
            ...conv.toObject(),
            unreadCount: conv.unreadCount.get(userId.toString()) || 0,
            otherUser: conv.participants.find(p => !p._id.equals(userId))
        }));

        res.json({
            success: true,
            conversations: conversationsWithUnread
        });
    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ success: false, message: "Failed to get conversations" });
    }
};

export default {
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
};
