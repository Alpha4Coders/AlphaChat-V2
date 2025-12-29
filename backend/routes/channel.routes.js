import express from "express";
import {
    getAllChannels,
    getChannel,
    joinChannel,
    leaveChannel,
    seedChannels
} from "../controllers/channel.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { isCofounder } from "../middlewares/role.middleware.js";

const router = express.Router();

// Get all channels (authenticated users only)
router.get("/", isAuthenticated, getAllChannels);

// Get single channel with messages
router.get("/:slug", isAuthenticated, getChannel);

// Join a channel
router.post("/:channelId/join", isAuthenticated, joinChannel);

// Leave a channel
router.post("/:channelId/leave", isAuthenticated, leaveChannel);

// Seed default channels (co-founders only)
router.post("/seed", isAuthenticated, isCofounder, seedChannels);

export default router;
