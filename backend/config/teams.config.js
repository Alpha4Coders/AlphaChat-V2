// ═══════════════════════════════════════════════════════════════════════════
// ALPHA CHATS V2 - TEAM & CHANNEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Co-founders have FULL ADMIN access to all channels
export const COFOUNDERS = [
    "Vortex-16",       // Vikash
    "Dealer-09",       // Archisman
    "PixelPioneer404", // Rajbeer
    "Rouvik"           // Rouvik
];

// Core Team has ELEVATED access (admins in channels, but not full system admin)
export const CORE_TEAM = [
    "AyushChowdhuryCSE",  // Ayush
    "AyanAlikhan11",      // Ayan
    "yourajdeep",         // Rajdeep
    "nikhil-chourasia",   // Nikhil
    "luckym-crypto",      // Shoaib
    "Jeet-Pathak"         // Jeet
];

// All admin/elevated users combined
export const ADMINS = [...COFOUNDERS, ...CORE_TEAM];

// Pre-configured Channels
export const DEFAULT_CHANNELS = [
    {
        name: "Web Dev",
        slug: "web-dev",
        description: "Backend + Frontend web development discussions",
        icon: "🌐",
        order: 1
    },
    {
        name: "App Dev",
        slug: "app-dev",
        description: "Mobile and desktop application development",
        icon: "📱",
        order: 2
    },
    {
        name: "Competitive Programming",
        slug: "competitive-programming",
        description: "CP discussions, problem solving, and contests",
        icon: "🏆",
        order: 3
    },
    {
        name: "AI/ML",
        slug: "ai-ml",
        description: "Artificial Intelligence and Machine Learning",
        icon: "🤖",
        order: 4
    },
    {
        name: "Cyber Security",
        slug: "cyber-security",
        description: "Security, CTFs, penetration testing, and more",
        icon: "🔐",
        order: 5
    },
    {
        name: "Operating System",
        slug: "operating-system",
        description: "OS concepts, Linux, Windows, kernel development",
        icon: "💻",
        order: 6
    },
    {
        name: "System Design",
        slug: "system-design",
        description: "Architecture, scalability, and system design interviews",
        icon: "🏗️",
        order: 7
    },
    {
        name: "Beginners",
        slug: "beginners",
        description: "C, Python & Java basics - Newcomer friendly!",
        icon: "🌱",
        order: 8
    }
];

// Check if a GitHub username is a co-founder
export const isCofounder = (username) => {
    return COFOUNDERS.map(u => u.toLowerCase()).includes(username?.toLowerCase());
};

// Check if a GitHub username is core team
export const isCoreTeam = (username) => {
    return CORE_TEAM.map(u => u.toLowerCase()).includes(username?.toLowerCase());
};

// Check if a GitHub username has admin privileges
export const isAdmin = (username) => {
    return ADMINS.map(u => u.toLowerCase()).includes(username?.toLowerCase());
};
