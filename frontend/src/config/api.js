// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

// GitHub OAuth
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';

// API Endpoints
export const ENDPOINTS = {
    AUTH: {
        GITHUB: `${API_URL}/api/auth/github`,
        ME: `${API_URL}/api/auth/me`,
        CHECK: `${API_URL}/api/auth/check`,
        LOGOUT: `${API_URL}/api/auth/logout`
    },
    CHANNELS: {
        LIST: `${API_URL}/api/channels`,
        GET: (slug) => `${API_URL}/api/channels/${slug}`,
        JOIN: (id) => `${API_URL}/api/channels/${id}/join`,
        LEAVE: (id) => `${API_URL}/api/channels/${id}/leave`
    },
    MESSAGES: {
        CHANNEL: (channelId) => `${API_URL}/api/messages/channel/${channelId}`,
        PIN: (messageId) => `${API_URL}/api/messages/pin/${messageId}`,
        DELETE: (messageId) => `${API_URL}/api/messages/channel/${messageId}`,
        EDIT: (messageId) => `${API_URL}/api/messages/channel/${messageId}`,
        REACTION: (messageId) => `${API_URL}/api/messages/reaction/${messageId}`,
        SAVE: (messageId) => `${API_URL}/api/messages/save/${messageId}`,
        SAVED: `${API_URL}/api/messages/saved`,
        CONVERSATIONS: `${API_URL}/api/messages/dm/conversations`,
        DM: (recipientId) => `${API_URL}/api/messages/dm/${recipientId}`
    },
    USERS: {
        LIST: `${API_URL}/api/users`,
        ONLINE: `${API_URL}/api/users/online`,
        SEARCH: `${API_URL}/api/users/search`,
        TEAM: `${API_URL}/api/users/team`,
        PROFILE: (username) => `${API_URL}/api/users/${username}`,
        STATUS: `${API_URL}/api/users/status`
    }
};
