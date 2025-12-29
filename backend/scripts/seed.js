import mongoose from "mongoose";
import dotenv from "dotenv";
import Channel from "../models/channel.model.js";
import User from "../models/user.model.js";
import { DEFAULT_CHANNELS, COFOUNDERS, CORE_TEAM } from "../config/teams.config.js";

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ Connected to MongoDB");

        // Seed channels
        console.log("\n📢 Seeding channels...");
        for (const channelData of DEFAULT_CHANNELS) {
            const exists = await Channel.findOne({ slug: channelData.slug });

            if (!exists) {
                await Channel.create({
                    ...channelData,
                    isDefault: true
                });
                console.log(`  ✓ Created: ${channelData.name}`);
            } else {
                console.log(`  - Exists: ${channelData.name}`);
            }
        }

        // Update existing users with correct roles
        console.log("\n👥 Updating user roles...");

        for (const username of COFOUNDERS) {
            const user = await User.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') }
            });

            if (user && user.role !== 'cofounder') {
                user.role = 'cofounder';
                await user.save();
                console.log(`  ✓ Set co-founder: ${username}`);
            }
        }

        for (const username of CORE_TEAM) {
            const user = await User.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') }
            });

            if (user && user.role !== 'core' && user.role !== 'cofounder') {
                user.role = 'core';
                await user.save();
                console.log(`  ✓ Set core team: ${username}`);
            }
        }

        console.log("\n✅ Database seeding complete!");
        console.log(`   Channels: ${DEFAULT_CHANNELS.length}`);
        console.log(`   Co-founders: ${COFOUNDERS.length}`);
        console.log(`   Core Team: ${CORE_TEAM.length}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
};

seedDatabase();
