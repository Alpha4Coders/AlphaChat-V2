import mongoose from "mongoose";

const directMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
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
        enum: ['text', 'code', 'image', 'file'],
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
        ref: "DirectMessage"
    },

    // Message status
    delivered: {
        type: Boolean,
        default: false
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
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
directMessageSchema.index({ conversation: 1, createdAt: -1 });
directMessageSchema.index({ sender: 1 });
directMessageSchema.index({ receiver: 1 });

const DirectMessage = mongoose.model("DirectMessage", directMessageSchema);

export default DirectMessage;
