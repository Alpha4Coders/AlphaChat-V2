import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FaGithub } from 'react-icons/fa'
import { setActiveConversation, setConversations } from '../../redux/chatSlice'
import axios from '../../config/axios'
import { ENDPOINTS } from '../../config/api'

// Default users - Co-founders and Core Team
const DEFAULT_USERS = [
    {
        id: 'default-1',
        displayName: 'Vikash Gupta',
        username: 'Vortex-16',
        github: 'https://github.com/Vortex-16',
        role: 'Co-founder',
        isDefault: true
    },
    {
        id: 'default-2',
        displayName: 'Archisman',
        username: 'Dealer-09',
        github: 'https://github.com/Dealer-09',
        role: 'Co-founder',
        isDefault: true
    },
    {
        id: 'default-3',
        displayName: 'Rajbeer',
        username: 'PixelPioneer404',
        github: 'https://github.com/PixelPioneer404',
        role: 'Co-founder',
        isDefault: true
    },
    {
        id: 'default-4',
        displayName: 'Rouvik',
        username: 'Rouvik',
        github: 'https://github.com/Rouvik',
        role: 'Co-founder',
        isDefault: true
    },
    {
        id: 'default-5',
        displayName: 'Ayush',
        username: 'AyushChowdhuryCSE',
        github: 'https://github.com/AyushChowdhuryCSE',
        role: 'Core Team',
        isDefault: true
    },
    {
        id: 'default-6',
        displayName: 'Ayan',
        username: 'AyanAlikhan11',
        github: 'https://github.com/AyanAlikhan11',
        role: 'Core Team',
        isDefault: true
    },
    {
        id: 'default-7',
        displayName: 'Rajdeep',
        username: 'yourajdeep',
        github: 'https://github.com/yourajdeep',
        role: 'Core Team',
        isDefault: true
    },
    {
        id: 'default-8',
        displayName: 'Nikhil',
        username: 'nikhil-chourasia',
        github: 'https://github.com/nikhil-chourasia',
        role: 'Core Team',
        isDefault: true
    },
    {
        id: 'default-9',
        displayName: 'Shoaib',
        username: 'shoaib',
        github: null,
        role: 'Core Team',
        isDefault: true
    },
    {
        id: 'default-10',
        displayName: 'Jeet',
        username: 'Jeet-Pathak',
        github: 'https://github.com/Jeet-Pathak',
        role: 'Core Team',
        isDefault: true
    }
]

const DMList = ({ searchQuery = '', isNewChatMode = false, onCloseNewChat }) => {
    const dispatch = useDispatch()
    const { conversations, activeConversation, onlineUsers } = useSelector(state => state.chat)
    const { user: currentUser } = useSelector(state => state.user)
    const [userAvatars, setUserAvatars] = useState({})

    // Fetch GitHub avatars for default users
    useEffect(() => {
        const fetchGitHubAvatars = async () => {
            const avatars = {}
            for (const user of DEFAULT_USERS) {
                if (user.github) {
                    try {
                        const response = await axios.get(`https://api.github.com/users/${user.username}`)
                        avatars[user.id] = response.data.avatar_url
                    } catch (error) {
                        console.error(`Failed to fetch avatar for ${user.username}:`, error)
                        avatars[user.id] = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=39ff14&color=0d0d0d&size=128`
                    }
                } else {
                    avatars[user.id] = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=39ff14&color=0d0d0d&size=128`
                }
            }
            setUserAvatars(avatars)
        }

        fetchGitHubAvatars()
    }, [])

    // Filter current user out of DEFAULT_USERS
    const availableUsers = DEFAULT_USERS.filter(u =>
        currentUser ? u.username.toLowerCase() !== currentUser.username.toLowerCase() : true
    );

    // Logic to determine which list to show
    const usersToShow = isNewChatMode ? availableUsers : conversations;

    const handleUserClick = async (clickedUser) => {
        try {
            // 1. If it's an existing conversation, just open it
            if (clickedUser._id && !clickedUser.isDefault) {
                dispatch(setActiveConversation(clickedUser))
                if (isNewChatMode && onCloseNewChat) onCloseNewChat()
                return
            }

            // 2. If it's a default user, check if we already have a conversation in Redux
            if (clickedUser.isDefault) {
                const existing = conversations.find(c => c.otherUser?.username === clickedUser.username)

                if (existing) {
                    dispatch(setActiveConversation(existing))
                    if (isNewChatMode && onCloseNewChat) onCloseNewChat()
                    return
                }

                // 3. If not, fetch real ID and create conversation
                try {
                    // Fetch user profile to get ID
                    const userRes = await axios.get(ENDPOINTS.USERS.PROFILE(clickedUser.username))
                    if (userRes.data.success) {
                        const recipientId = userRes.data.user._id

                        // Get or create conversation
                        const convRes = await axios.get(ENDPOINTS.MESSAGES.DM(recipientId))

                        if (convRes.data.success) {
                            const newConv = convRes.data.conversation
                            // Populate otherUser manually for immediate UI update if needed, though API usually returns it
                            // API returns 'conversation' object. We need to format it like 'conversations' list items
                            // which usually have 'otherUser' property attached in getConversations selector or backend
                            // The backend 'getConversation' returns populated participants.

                            // We need to shape it for Redux if it's new
                            const otherUser = newConv.participants.find(p => p._id !== currentUser._id) || userRes.data.user
                            const convForState = {
                                ...newConv,
                                otherUser: otherUser
                            }

                            dispatch(setActiveConversation(convForState))

                            // Optimistically add to conversations list if not present
                            const isAlreadyInList = conversations.some(c => c._id === newConv._id)
                            if (!isAlreadyInList) {
                                dispatch(setConversations([convForState, ...conversations]))
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to create conversation:', error)
                }

                if (isNewChatMode && onCloseNewChat) onCloseNewChat()
            }
        } catch (error) {
            console.error('Handle user click error:', error)
        }
    }

    const filteredUsers = usersToShow.filter(item => {
        const user = isNewChatMode ? item : item.otherUser;
        if (!user) return false;

        const name = user.displayName || ''
        const username = user.username || ''
        const query = searchQuery.toLowerCase()
        return name.toLowerCase().includes(query) || username.toLowerCase().includes(query)
    })

    const isUserOnline = (user) => {
        if (user.otherUser?._id) {
            return onlineUsers.includes(user.otherUser._id)
        }
        return false // Default users assumed offline if not matched
    }

    const getUserAvatar = (item) => {
        const user = isNewChatMode ? item : item.otherUser;
        if (!user) return '';

        if (user.avatar) {
            return user.avatar
        }
        if (item.isDefault && userAvatars[item.id]) {
            return userAvatars[item.id]
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=39ff14&color=0d0d0d&size=128`
    }

    // Role-based styling helper
    const getRoleNameClass = (role) => {
        if (role === 'Co-founder') return 'text-[#ff6f3c] font-bold text-glow-orange';
        if (role === 'Core Team') return 'text-[#39ff14] font-bold text-glow-green';
        return 'text-white';
    }

    return (
        <div className="dm-list">
            {/* Connection Status - Only show in main list */}
            {!isNewChatMode && (
                <div className="dm-connection-status">
                    <div className="dm-status-dot"></div>
                    <span className="dm-status-text">Connected</span>
                </div>
            )}

            {isNewChatMode && (
                <div className="text-xs text-gray-500 px-4 py-2 border-b border-[#39ff14]/10 bg-[#39ff14]/5">
                    Select a developer to message
                </div>
            )}

            {/* Users List */}
            <div className="dm-users-scroll">
                {filteredUsers.length === 0 ? (
                    <p className="dm-no-users">
                        {isNewChatMode ? 'No developers found' : 'No active conversations'}
                    </p>
                ) : (
                    filteredUsers.map((item, index) => {
                        const user = isNewChatMode ? item : item.otherUser;
                        const displayName = user?.displayName
                        const username = user?.username
                        const role = item.role || user?.role

                        // Active state logic
                        const isActive = !isNewChatMode && activeConversation?._id === item._id;
                        const isOnline = isUserOnline(item)

                        return (
                            <div
                                key={item._id || item.id || index}
                                onClick={() => handleUserClick(item)}
                                className={`dm-user-card ${isActive ? 'active' : ''}`}
                            >
                                <div className="dm-user-avatar-wrapper">
                                    <img
                                        src={getUserAvatar(item)}
                                        alt={displayName}
                                        className="dm-user-avatar"
                                    />
                                    {/* Only show online status for actual convo users */}
                                    {!isNewChatMode && (
                                        <div className={`dm-user-status ${isOnline ? 'online' : 'offline'}`}></div>
                                    )}
                                </div>
                                <div className="dm-user-info">
                                    <div className={`dm-user-name ${isNewChatMode ? getRoleNameClass(role) : ''}`}>
                                        {displayName}
                                        {isNewChatMode && role && (
                                            <span className="text-[10px] ml-2 opacity-70 font-normal px-1.5 py-0.5 rounded border border-current inline-block">
                                                {role === 'Co-founder' ? 'CF' : 'CORE'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="dm-user-username">@{username}</div>
                                    {!isNewChatMode && (
                                        <div className="dm-user-status-text">
                                            {isOnline ? 'Online' : 'Offline'}
                                        </div>
                                    )}
                                </div>
                                {isNewChatMode && item.github && (
                                    <a
                                        href={item.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="dm-user-github"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FaGithub />
                                    </a>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default DMList
