import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { HiChevronDown, HiPlus } from 'react-icons/hi'
import { FaTerminal, FaHashtag } from 'react-icons/fa'
import { gsap } from 'gsap'
import { setActiveChannel, setActiveConversation, updateChannelMembership } from '../../redux/chatSlice'
import { addJoinedChannel } from '../../redux/userSlice'
import { joinChannel as socketJoinChannel } from '../../hooks/useSocket'
import axios from '../../config/axios'
import { ENDPOINTS } from '../../config/api'

const Sidebar = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { user } = useSelector(state => state.user)
    const { channels, conversations, activeChannel, activeConversation, onlineUsers } = useSelector(state => state.chat)
    const [searchQuery, setSearchQuery] = useState('')
    const [channelsExpanded, setChannelsExpanded] = useState(true)
    const [dmsExpanded, setDmsExpanded] = useState(true)
    const channelsRef = useRef(null)
    const dmsRef = useRef(null)
    const scrollContainerRef = useRef(null)

    // GSAP animation on section toggle - with clearProps to prevent layout issues
    useEffect(() => {
        if (channelsRef.current) {
            const items = channelsRef.current.querySelectorAll('.slack-channel-item')
            if (channelsExpanded && items.length > 0) {
                gsap.fromTo(items,
                    { opacity: 0, x: -10 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.2,
                        stagger: 0.02,
                        ease: 'power2.out',
                        clearProps: 'all' // Prevent leftover GSAP styles
                    }
                )
            }
        }
    }, [channelsExpanded])

    useEffect(() => {
        if (dmsRef.current) {
            const items = dmsRef.current.querySelectorAll('.slack-dm-item')
            if (dmsExpanded && items.length > 0) {
                gsap.fromTo(items,
                    { opacity: 0, x: -10 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.2,
                        stagger: 0.02,
                        ease: 'power2.out',
                        clearProps: 'all' // Prevent leftover GSAP styles
                    }
                )
            }
        }
    }, [dmsExpanded])

    const handleChannelClick = async (channel) => {
        console.log('handleChannelClick called with channel:', channel)
        dispatch(setActiveChannel(channel))
        // setActiveChannel already clears activeConversation
        socketJoinChannel(channel._id)
    }

    const handleJoinChannel = async (channel, e) => {
        e.stopPropagation()
        try {
            const res = await axios.post(ENDPOINTS.CHANNELS.JOIN(channel._id))
            if (res.data.success) {
                dispatch(updateChannelMembership({ channelId: channel._id, isMember: true }))
                dispatch(addJoinedChannel(channel))
                handleChannelClick(channel)
            }
        } catch (error) {
            console.error('Failed to join channel:', error)
        }
    }

    const handleConversationClick = (conversation) => {
        dispatch(setActiveConversation(conversation))
        // setActiveConversation already clears activeChannel
    }

    const filteredChannels = channels.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredConversations = conversations.filter(c =>
        c.otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="alpha-sidebar w-72 h-full flex flex-col">
            {/* Workspace Header */}
            <div className="flex-shrink-0 p-3 border-b border-[#39ff14]/10">
                <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#39ff14]/5 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <FaTerminal className="w-5 h-5 text-[#39ff14]" />
                        <span className="text-lg font-bold text-white">
                            Alpha<span className="text-[#39ff14]">Chats</span>
                        </span>
                    </div>
                    <HiChevronDown className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Search */}
            <div className="flex-shrink-0 p-3">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-[#39ff14]/5 border border-[#39ff14]/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#39ff14]/30"
                />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
                {/* Channels Section */}
                <div className="slack-section">
                    <div
                        className="slack-section-header"
                        onClick={() => setChannelsExpanded(!channelsExpanded)}
                    >
                        <div className={`slack-section-title ${!channelsExpanded ? 'collapsed' : ''}`}>
                            <HiChevronDown className="w-3 h-3" />
                            <span>Channels</span>
                        </div>
                        <button className="slack-section-add" onClick={(e) => e.stopPropagation()}>
                            <HiPlus className="w-4 h-4" />
                        </button>
                    </div>

                    {channelsExpanded && (
                        <div ref={channelsRef} className="mt-1">
                            {filteredChannels.map(channel => {
                                const canAccess = channel.isMember || user?.role === 'cofounder' || user?.role === 'core'
                                return (
                                    <div
                                        key={channel._id}
                                        onClick={() => {
                                            console.log('Channel clicked:', channel.name, 'canAccess:', canAccess, 'user.role:', user?.role, 'isMember:', channel.isMember)
                                            if (canAccess) handleChannelClick(channel)
                                        }}
                                        className={`slack-channel-item ${activeChannel?._id === channel._id ? 'active' : ''
                                            } ${!canAccess ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span className="slack-channel-hash">#</span>
                                        <span className="slack-channel-name">{channel.name}</span>
                                        {!channel.isMember && user?.role !== 'cofounder' && user?.role !== 'core' && (
                                            <button
                                                onClick={(e) => handleJoinChannel(channel, e)}
                                                className="text-xs px-2 py-0.5 bg-[#39ff14]/10 text-[#39ff14] rounded hover:bg-[#39ff14]/20"
                                            >
                                                Join
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Direct Messages Section */}
                <div className="slack-section mt-2">
                    <div
                        className="slack-section-header"
                        onClick={() => setDmsExpanded(!dmsExpanded)}
                    >
                        <div className={`slack-section-title ${!dmsExpanded ? 'collapsed' : ''}`}>
                            <HiChevronDown className="w-3 h-3" />
                            <span>Direct Messages</span>
                        </div>
                        <button className="slack-section-add" onClick={(e) => e.stopPropagation()}>
                            <HiPlus className="w-4 h-4" />
                        </button>
                    </div>

                    {dmsExpanded && (
                        <div ref={dmsRef} className="mt-1">
                            {filteredConversations.length === 0 ? (
                                <p className="text-xs text-gray-600 px-6 py-2">No conversations</p>
                            ) : (
                                filteredConversations.map(conversation => (
                                    <div
                                        key={conversation._id}
                                        onClick={() => handleConversationClick(conversation)}
                                        className={`slack-dm-item ${activeConversation?._id === conversation._id ? 'active' : ''
                                            }`}
                                    >
                                        <div className="slack-dm-avatar">
                                            <img
                                                src={conversation.otherUser?.avatar}
                                                alt={conversation.otherUser?.displayName}
                                            />
                                            {onlineUsers.includes(conversation.otherUser?._id) ? (
                                                <div className="slack-online-dot" />
                                            ) : (
                                                <div className="slack-offline-dot" />
                                            )}
                                        </div>
                                        <span className="slack-channel-name">
                                            {conversation.otherUser?.displayName}
                                        </span>
                                        {conversation.unreadCount > 0 && (
                                            <span className="slack-channel-badge">
                                                {conversation.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* User Footer */}
            <div className="flex-shrink-0 p-3 border-t border-[#39ff14]/10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={user?.avatar}
                            alt={user?.displayName}
                            className="w-9 h-9 rounded-lg"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#39ff14] rounded-full border-2 border-[#0d0d0d]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.displayName}</p>
                        <p className="text-xs text-gray-500">@{user?.username}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Sidebar
