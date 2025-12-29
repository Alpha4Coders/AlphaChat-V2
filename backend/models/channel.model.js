import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        default: ""
    },
    icon: {
        type: String,
        default: "💬"
    },

    // Channel type
    type: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },

    // Members who have joined this channel (can chat)
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    // Admins of this channel (can pin, delete messages)
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    // Pinned messages
    pinnedMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChannelMessage"
    }],

    // Message count for quick stats
    messageCount: {
        type: Number,
        default: 0
    },

    // Last activity timestamp
    lastActivity: {
        type: Date,
        default: Date.now
    },

    // Order for display in sidebar
    order: {
        type: Number,
        default: 0
    },

    // Is this a default channel that all users can see
    isDefault: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for faster queries
channelSchema.index({ slug: 1 });
channelSchema.index({ order: 1 });

const Channel = mongoose.model("Channel", channelSchema);

export default Channel;
