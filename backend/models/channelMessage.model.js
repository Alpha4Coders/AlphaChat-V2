import mongoose from "mongoose";

const channelMessageSchema = new mongoose.Schema({
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Message content
    content: {
        type: String,
        default: ""
    },

    // Message type for special formatting
    messageType: {
        type: String,
        enum: ['text', 'code', 'image', 'file', 'system'],
        default: 'text'
    },

    // For code messages
    codeLanguage: {
        type: String,
        default: ""
    },

    // File attachments
    files: [{
        name: String,
        url: String,
        size: Number,
        type: String
    }],

    // Image URL (if image message)
    imageUrl: {
        type: String,
        default: ""
    },

    // Reply to another message
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChannelMessage"
    },

    // Reactions (emoji -> array of user IDs)
    reactions: {
        type: Map,
        of: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        default: new Map()
    },

    // Is this message pinned
    isPinned: {
        type: Boolean,
        default: false
    },

    // Is this message deleted (soft delete)
    isDeleted: {
        type: Boolean,
        default: false
    },

    // Edit history
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    }
}, { timestamps: true });

// Index for faster queries
channelMessageSchema.index({ channel: 1, createdAt: -1 });
channelMessageSchema.index({ sender: 1 });

const ChannelMessage = mongoose.model("ChannelMessage", channelMessageSchema);

export default ChannelMessage;
