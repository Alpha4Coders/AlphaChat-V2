import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    // Two participants in DM conversation
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],

    // Last message for preview in sidebar
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DirectMessage"
    },

    // Last activity timestamp
    lastActivity: {
        type: Date,
        default: Date.now
    },

    // Unread count per user
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    }
}, { timestamps: true });

// Ensure unique conversation between two users
conversationSchema.index({ participants: 1 }, { unique: true });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
