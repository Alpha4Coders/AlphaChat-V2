import User from "../models/user.model.js";

// Get all users (for DM lists)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id } })
            .select('username displayName avatar role isOnline lastSeen')
            .sort({ isOnline: -1, lastSeen: -1 });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

// Get user profile by username
export const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username })
            .select('username displayName avatar bio company location profileUrl role isOnline lastSeen joinedChannels')
            .populate('joinedChannels', 'name slug icon');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Get user profile error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user profile" });
    }
};

// Update current user's status
export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['online', 'offline', 'away', 'busy'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        await User.findByIdAndUpdate(req.user._id, {
            status,
            isOnline: status === 'online'
        });

        res.json({
            success: true,
            message: "Status updated"
        });
    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

// Get online users count
export const getOnlineUsers = async (req, res) => {
    try {
        const onlineUsers = await User.find({ isOnline: true })
            .select('username displayName avatar role')
            .limit(50);

        res.json({
            success: true,
            count: onlineUsers.length,
            users: onlineUsers
        });
    } catch (error) {
        console.error("Get online users error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch online users" });
    }
};

// Search users
export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, users: [] });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { displayName: { $regex: q, $options: 'i' } }
            ],
            _id: { $ne: req.user._id }
        })
            .select('username displayName avatar role isOnline')
            .limit(10);

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error("Search users error:", error);
        res.status(500).json({ success: false, message: "Search failed" });
    }
};

// Get team members (co-founders and core team)
export const getTeamMembers = async (req, res) => {
    try {
        const cofounders = await User.find({ role: 'cofounder' })
            .select('username displayName avatar bio profileUrl isOnline')
            .sort({ username: 1 });

        const coreTeam = await User.find({ role: 'core' })
            .select('username displayName avatar bio profileUrl isOnline')
            .sort({ username: 1 });

        res.json({
            success: true,
            cofounders,
            coreTeam
        });
    } catch (error) {
        console.error("Get team members error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch team members" });
    }
};

export default {
    getAllUsers,
    getUserProfile,
    updateStatus,
    getOnlineUsers,
    searchUsers,
    getTeamMembers
};
