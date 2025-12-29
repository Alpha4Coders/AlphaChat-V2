// Authentication middleware - checks if user is logged in
export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    return res.status(401).json({
        success: false,
        message: "Unauthorized - Please log in with GitHub"
    });
};

// Check if user has joined a specific channel
export const hasChannelAccess = (req, res, next) => {
    const { channelId } = req.params;
    const user = req.user;

    // Co-founders and core team always have access
    if (user.role === 'cofounder' || user.role === 'core') {
        return next();
    }

    // Check if user has joined this channel
    if (user.joinedChannels && user.joinedChannels.includes(channelId)) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "You need to join this channel first to send messages"
    });
};

export default { isAuthenticated, hasChannelAccess };
