import User from "../models/user.model.js";
import Channel from "../models/channel.model.js";
import { DEFAULT_CHANNELS } from "../config/teams.config.js";

// GitHub OAuth Callback Handler
export const githubCallback = async (req, res) => {
    try {
        // User is already authenticated by Passport at this point
        const user = req.user;

        // Auto-join co-founders and core team to all channels
        if (user.role === 'cofounder' || user.role === 'core') {
            const allChannels = await Channel.find({});
            const channelIds = allChannels.map(c => c._id);

            // Add user to all channels if not already member
            for (const channel of allChannels) {
                if (!channel.members.includes(user._id)) {
                    channel.members.push(user._id);

                    // Co-founders are admins of all channels
                    if (user.role === 'cofounder' && !channel.admins.includes(user._id)) {
                        channel.admins.push(user._id);
                    }

                    await channel.save();
                }
            }

            // Update user's joined channels
            user.joinedChannels = channelIds;
            await user.save();
        }

        // Redirect to frontend
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/chat`);
    } catch (error) {
        console.error("GitHub callback error:", error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
};

// Get current authenticated user
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        const user = await User.findById(req.user._id)
            .populate('joinedChannels', 'name slug icon');

        res.json({
            success: true,
            user: {
                id: user._id,
                githubId: user.githubId,
                username: user.username,
                displayName: user.displayName,
                email: user.email,
                avatar: user.avatar,
                profileUrl: user.profileUrl,
                bio: user.bio,
                company: user.company,
                location: user.location,
                role: user.role,
                joinedChannels: user.joinedChannels,
                status: user.status,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen
            }
        });
    } catch (error) {
        console.error("Get current user error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Logout
export const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Logout failed"
            });
        }

        req.session.destroy((err) => {
            if (err) {
                console.error("Session destroy error:", err);
            }

            res.clearCookie('connect.sid');
            res.json({
                success: true,
                message: "Logged out successfully"
            });
        });
    });
};

// Check auth status
export const checkAuth = (req, res) => {
    res.json({
        success: true,
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? {
            id: req.user._id,
            username: req.user.username,
            avatar: req.user.avatar,
            role: req.user.role
        } : null
    });
};

export default { githubCallback, getCurrentUser, logout, checkAuth };
