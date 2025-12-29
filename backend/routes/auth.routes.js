import express from "express";
import passport from "passport";
import { getCurrentUser, logout, checkAuth, githubCallback } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GitHub OAuth - Initiate login
router.get("/github", passport.authenticate("github", { scope: ["user:email", "read:user"] }));

// GitHub OAuth - Callback URL
router.get("/github/callback",
    passport.authenticate("github", {
        failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
        session: true
    }),
    githubCallback
);

// Get current authenticated user
router.get("/me", isAuthenticated, getCurrentUser);

// Check if user is authenticated
router.get("/check", checkAuth);

// Logout
router.post("/logout", isAuthenticated, logout);

export default router;
