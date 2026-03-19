import express from "express";
import {
    getAllUsers,
    getUserProfile,
    updateStatus,
    getOnlineUsers,
    searchUsers,
    getTeamMembers
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get all users (for DM list)
router.get("/", isAuthenticated, getAllUsers);

// Get online users
router.get("/online", isAuthenticated, getOnlineUsers);

// Search users
router.get("/search", isAuthenticated, searchUsers);

// Get team members (co-founders and core team)
router.get("/team", isAuthenticated, getTeamMembers);

// Update current user's status (must be before /:username to avoid route collision)
router.patch("/status", isAuthenticated, updateStatus);

// Get user profile by username
router.get("/:username", isAuthenticated, getUserProfile);

export default router;
