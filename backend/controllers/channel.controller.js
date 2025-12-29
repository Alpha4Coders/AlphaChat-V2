import Channel from "../models/channel.model.js";
import ChannelMessage from "../models/channelMessage.model.js";
import User from "../models/user.model.js";
import { DEFAULT_CHANNELS } from "../config/teams.config.js";

// Get all channels (everyone can see, but must join to chat)
export const getAllChannels = async (req, res) => {
    try {
        const channels = await Channel.find({ isDefault: true })
            .select('name slug description icon order messageCount lastActivity members')
            .sort({ order: 1 });

        // Add membership status for current user
        const channelsWithMembership = channels.map(channel => ({
            ...channel.toObject(),
            isMember: channel.members.includes(req.user._id),
            memberCount: channel.members.length
        }));

        res.json({
            success: true,
            channels: channelsWithMembership
        });
    } catch (error) {
        console.error("Get channels error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch channels"
        });
    }
};

// Get single channel with messages
export const getChannel = async (req, res) => {
    try {
        const { slug } = req.params;

        const channel = await Channel.findOne({ slug })
            .populate('members', 'username displayName avatar isOnline')
            .populate('admins', 'username displayName avatar')
            .populate({
                path: 'pinnedMessages',
                populate: { path: 'sender', select: 'username displayName avatar' }
            });

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found"
            });
        }

        // Get recent messages with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await ChannelMessage.find({
            channel: channel._id,
            isDeleted: false
        })
            .populate('sender', 'username displayName avatar role')
            .populate({
                path: 'replyTo',
                populate: { path: 'sender', select: 'username displayName avatar' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalMessages = await ChannelMessage.countDocuments({
            channel: channel._id,
            isDeleted: false
        });

        res.json({
            success: true,
            channel: {
                ...channel.toObject(),
                isMember: channel.members.some(m => m._id.equals(req.user._id)),
                isAdmin: channel.admins.some(a => a._id.equals(req.user._id)) || req.user.role === 'cofounder'
            },
            messages: messages.reverse(), // Oldest first for display
            pagination: {
                page,
                limit,
                total: totalMessages,
                hasMore: skip + messages.length < totalMessages
            }
        });
    } catch (error) {
        console.error("Get channel error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch channel"
        });
    }
};

// Join a channel
export const joinChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.user._id;

        const channel = await Channel.findById(channelId);

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found"
            });
        }

        // Check if already a member
        if (channel.members.includes(userId)) {
            return res.json({
                success: true,
                message: "Already a member of this channel"
            });
        }

        // Add user to channel members
        channel.members.push(userId);
        await channel.save();

        // Add channel to user's joined channels
        await User.findByIdAndUpdate(userId, {
            $addToSet: { joinedChannels: channelId }
        });

        res.json({
            success: true,
            message: `Joined ${channel.name} successfully`
        });
    } catch (error) {
        console.error("Join channel error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to join channel"
        });
    }
};

// Leave a channel
export const leaveChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.user._id;

        // Co-founders and core team cannot leave channels
        if (req.user.role === 'cofounder' || req.user.role === 'core') {
            return res.status(403).json({
                success: false,
                message: "Team members cannot leave channels"
            });
        }

        const channel = await Channel.findById(channelId);

        if (!channel) {
            return res.status(404).json({
                success: false,
                message: "Channel not found"
            });
        }

        // Remove user from channel members
        channel.members = channel.members.filter(m => !m.equals(userId));
        await channel.save();

        // Remove channel from user's joined channels
        await User.findByIdAndUpdate(userId, {
            $pull: { joinedChannels: channelId }
        });

        res.json({
            success: true,
            message: `Left ${channel.name}`
        });
    } catch (error) {
        console.error("Leave channel error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to leave channel"
        });
    }
};

// Seed default channels (run once during setup)
export const seedChannels = async (req, res) => {
    try {
        // Only co-founders can seed channels
        if (req.user.role !== 'cofounder') {
            return res.status(403).json({
                success: false,
                message: "Only co-founders can seed channels"
            });
        }

        const createdChannels = [];

        for (const channelData of DEFAULT_CHANNELS) {
            const existingChannel = await Channel.findOne({ slug: channelData.slug });

            if (!existingChannel) {
                const channel = await Channel.create({
                    ...channelData,
                    isDefault: true,
                    members: [req.user._id],
                    admins: [req.user._id]
                });
                createdChannels.push(channel);
            }
        }

        res.json({
            success: true,
            message: `Created ${createdChannels.length} new channels`,
            channels: createdChannels
        });
    } catch (error) {
        console.error("Seed channels error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to seed channels"
        });
    }
};

export default { getAllChannels, getChannel, joinChannel, leaveChannel, seedChannels };
