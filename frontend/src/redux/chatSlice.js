import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    // Channels
    channels: [],
    activeChannel: null,
    channelMessages: {},

    // Direct Messages
    conversations: [],
    activeConversation: null,
    dmMessages: {},

    // Saved Messages
    savedMessageIds: [],

    // UI State
    activeTab: 'channels', // 'channels' | 'dms'
    typingUsers: {},
    onlineUsers: [],

    // Loading states
    isLoadingChannels: false,
    isLoadingMessages: false,
    isSendingMessage: false
}

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // Channels
        setChannels: (state, action) => {
            state.channels = action.payload
            state.isLoadingChannels = false
        },
        setActiveChannel: (state, action) => {
            state.activeChannel = action.payload
            state.activeConversation = null
            state.activeTab = 'channels'
        },
        updateChannelMembership: (state, action) => {
            const { channelId, isMember } = action.payload
            const channel = state.channels.find(c => c._id === channelId)
            if (channel) {
                channel.isMember = isMember
            }
        },

        // Channel Messages
        setChannelMessages: (state, action) => {
            const { channelId, messages, append } = action.payload
            if (append && state.channelMessages[channelId]) {
                state.channelMessages[channelId] = [
                    ...messages,
                    ...state.channelMessages[channelId]
                ]
            } else {
                state.channelMessages[channelId] = messages
            }
            state.isLoadingMessages = false
        },
        addChannelMessage: (state, action) => {
            const { channelId, message } = action.payload
            if (!state.channelMessages[channelId]) {
                state.channelMessages[channelId] = []
            }
            // Avoid duplicates
            if (!state.channelMessages[channelId].find(m => m._id === message._id)) {
                state.channelMessages[channelId].push(message)
            }
        },
        updateChannelMessage: (state, action) => {
            const { channelId, messageId, updates } = action.payload
            const messages = state.channelMessages[channelId]
            if (messages) {
                const index = messages.findIndex(m => m._id === messageId)
                if (index !== -1) {
                    state.channelMessages[channelId][index] = {
                        ...messages[index],
                        ...updates
                    }
                }
            }
        },
        updateMessageReactions: (state, action) => {
            const { channelId, messageId, reactions } = action.payload
            const messages = state.channelMessages[channelId]
            if (messages) {
                const index = messages.findIndex(m => m._id === messageId)
                if (index !== -1) {
                    state.channelMessages[channelId][index].reactions = reactions
                }
            }
        },

        // Conversations
        setConversations: (state, action) => {
            state.conversations = action.payload
        },
        setActiveConversation: (state, action) => {
            state.activeConversation = action.payload
            state.activeChannel = null
            state.activeTab = 'dms'
        },

        // DM Messages
        setDMMessages: (state, action) => {
            const { conversationId, messages, append } = action.payload
            if (append && state.dmMessages[conversationId]) {
                state.dmMessages[conversationId] = [
                    ...messages,
                    ...state.dmMessages[conversationId]
                ]
            } else {
                state.dmMessages[conversationId] = messages
            }
            state.isLoadingMessages = false
        },
        addDMMessage: (state, action) => {
            const { conversationId, message } = action.payload
            if (!state.dmMessages[conversationId]) {
                state.dmMessages[conversationId] = []
            }
            if (!state.dmMessages[conversationId].find(m => m._id === message._id)) {
                state.dmMessages[conversationId].push(message)
            }
        },

        // Saved Messages
        setSavedMessageIds: (state, action) => {
            state.savedMessageIds = action.payload
        },
        addSavedMessage: (state, action) => {
            if (!state.savedMessageIds.includes(action.payload)) {
                state.savedMessageIds.push(action.payload)
            }
        },
        removeSavedMessage: (state, action) => {
            state.savedMessageIds = state.savedMessageIds.filter(id => id !== action.payload)
        },

        // Tab
        setActiveTab: (state, action) => {
            state.activeTab = action.payload
        },

        // Typing
        setTypingUser: (state, action) => {
            const { userId, userName, channelId, isTyping } = action.payload
            const key = channelId || 'dm'

            if (!state.typingUsers[key]) {
                state.typingUsers[key] = {}
            }

            if (isTyping) {
                state.typingUsers[key][userId] = userName
            } else {
                delete state.typingUsers[key][userId]
            }
        },

        // Online Users
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload
        },

        // Loading States
        setLoadingChannels: (state, action) => {
            state.isLoadingChannels = action.payload
        },
        setLoadingMessages: (state, action) => {
            state.isLoadingMessages = action.payload
        },
        setSendingMessage: (state, action) => {
            state.isSendingMessage = action.payload
        }
    }
})

export const {
    setChannels,
    setActiveChannel,
    updateChannelMembership,
    setChannelMessages,
    addChannelMessage,
    updateChannelMessage,
    updateMessageReactions,
    setConversations,
    setActiveConversation,
    setDMMessages,
    addDMMessage,
    setSavedMessageIds,
    addSavedMessage,
    removeSavedMessage,
    setActiveTab,
    setTypingUser,
    setOnlineUsers,
    setLoadingChannels,
    setLoadingMessages,
    setSendingMessage
} = chatSlice.actions

export default chatSlice.reducer
