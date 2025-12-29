import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/user.model.js";
import { COFOUNDERS, CORE_TEAM } from "./teams.config.js";

// Determine user role based on GitHub username
const determineRole = (username) => {
    const lowerUsername = username.toLowerCase();

    if (COFOUNDERS.map(u => u.toLowerCase()).includes(lowerUsername)) {
        return 'cofounder';
    }

    if (CORE_TEAM.map(u => u.toLowerCase()).includes(lowerUsername)) {
        return 'core';
    }

    return 'member';
};

const configurePassport = () => {
    // Serialize user to session
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // GitHub OAuth Strategy
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email', 'read:user']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({ githubId: profile.id });

            if (user) {
                // Update existing user with latest GitHub data
                user.username = profile.username;
                user.displayName = profile.displayName || profile.username;
                user.avatar = profile.photos?.[0]?.value || "";
                user.profileUrl = profile.profileUrl || `https://github.com/${profile.username}`;
                user.bio = profile._json?.bio || "";
                user.company = profile._json?.company || "";
                user.location = profile._json?.location || "";
                user.accessToken = accessToken;

                // Update role in case team config changed
                user.role = determineRole(profile.username);

                await user.save();
            } else {
                // Create new user
                const role = determineRole(profile.username);

                user = await User.create({
                    githubId: profile.id,
                    username: profile.username,
                    displayName: profile.displayName || profile.username,
                    email: profile.emails?.[0]?.value || "",
                    avatar: profile.photos?.[0]?.value || "",
                    profileUrl: profile.profileUrl || `https://github.com/${profile.username}`,
                    bio: profile._json?.bio || "",
                    company: profile._json?.company || "",
                    location: profile._json?.location || "",
                    role: role,
                    accessToken: accessToken
                });

                console.log(`🆕 New user registered: ${profile.username} (${role})`);
            }

            return done(null, user);
        } catch (error) {
            console.error("GitHub OAuth Error:", error);
            return done(error, null);
        }
    }));
};

export default configurePassport;
