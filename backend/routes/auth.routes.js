import express from "express";
import passport from "passport";
import { getCurrentUser, logout, checkAuth, githubCallback, mobileAuthSuccess } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GitHub OAuth - Initiate login (Web)
router.get("/github", passport.authenticate("github", { scope: ["user:email", "read:user"] }));

// GitHub OAuth - Initiate login (Mobile)
// Sets a session flag so callback knows to redirect to mobile success page
router.get("/github/mobile", (req, res, next) => {
    // Set flag in session to indicate mobile OAuth
    req.session.oauthMobile = true;
    req.session.save((err) => {
        if (err) console.error("Session save error:", err);
        // Continue to GitHub OAuth
        passport.authenticate("github", { scope: ["user:email", "read:user"] })(req, res, next);
    });
});

// GitHub OAuth - Callback URL (handles both web and mobile)
router.get("/github/callback",
    passport.authenticate("github", {
        failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
        session: true
    }),
    githubCallback
);

// Mobile OAuth Success Page - Simple HTML page that mobile WebView can detect
router.get("/mobile/success", mobileAuthSuccess);

// Get current authenticated user
router.get("/me", isAuthenticated, getCurrentUser);

// Check if user is authenticated
router.get("/check", checkAuth);

// Logout
router.post("/logout", isAuthenticated, logout);

export default router;
