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

        // Check if this is a mobile OAuth request (state parameter set by mobile app OR user agent)
        const userAgent = req.headers['user-agent'] || '';
        const isMobile = req.session?.oauthMobile === true || userAgent.includes('AlphaChatMobile');

        if (isMobile) {
            // Clear the mobile flag
            delete req.session.oauthMobile;

            // Redirect to backend's own mobile success page
            // Mobile WebView will catch this URL and extract cookies
            return res.redirect('/api/auth/mobile/success');
        }

        // Web: Redirect to frontend
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/chat`);
    } catch (error) {
        console.error("GitHub callback error:", error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
};

// Mobile OAuth Success Page - Returns simple HTML that mobile WebView can detect
export const mobileAuthSuccess = (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Return a simple HTML page that the mobile app can detect
    // The session cookie is already set, mobile just needs to detect this page loaded
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>AlphaChat - Login Success</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #012106 0%, #020E2A 50%, #012106 100%);
                    color: #07AD52;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .container { padding: 20px; }
                h1 { font-size: 24px; margin-bottom: 10px; }
                p { color: #888; font-size: 14px; }
                .success { font-size: 48px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success">✓</div>
                <h1>Login Successful!</h1>
                <p>Redirecting to app...</p>
            </div>
        </body>
        </html>
    `);
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

export default { githubCallback, getCurrentUser, logout, checkAuth, mobileAuthSuccess };
