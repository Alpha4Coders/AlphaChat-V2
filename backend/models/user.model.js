import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // GitHub OAuth Data
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    default: ""
  },
  avatar: {
    type: String,
    default: ""
  },
  profileUrl: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  company: {
    type: String,
    default: ""
  },
  location: {
    type: String,
    default: ""
  },

  // Role System - Co-founders and Core team get special access
  role: {
    type: String,
    enum: ['cofounder', 'core', 'member'],
    default: 'member'
  },

  // Channels user has joined
  joinedChannels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel"
  }],

  // Saved/Bookmarked messages
  savedMessages: [{
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    messageType: {
      type: String,
      enum: ['channel', 'dm'],
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Online Status
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },

  // Access Token (for API calls to GitHub if needed)
  accessToken: {
    type: String,
    select: false
  }
}, { timestamps: true });

// Index for faster queries (githubId and username already have unique indexes from schema)
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
