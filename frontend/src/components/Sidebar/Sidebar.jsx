import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { HiChevronDown, HiRefresh, HiSearch } from 'react-icons/hi'
import { HiChatAlt2, HiHashtag, HiPlus, HiX } from 'react-icons/hi'
import { FaTerminal } from 'react-icons/fa'
import { setActiveChannel, updateChannelMembership } from '../../redux/chatSlice'
import { addJoinedChannel } from '../../redux/userSlice'
import { joinChannel as socketJoinChannel } from '../../hooks/useSocket'
import axios from '../../config/axios'
import { ENDPOINTS } from '../../config/api'
import DMList from './DMList'

const Sidebar = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { user } = useSelector(state => state.user)
    const { channels, activeChannel } = useSelector(state => state.chat)

    const [activeTab, setActiveTab] = useState('channels') // 'chats' | 'channels'
    const [searchQuery, setSearchQuery] = useState('')
    const [showNewChat, setShowNewChat] = useState(false)

    const handleChannelClick = async (channel) => {
        dispatch(setActiveChannel(channel))
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

    const filteredChannels = channels.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getSearchPlaceholder = () => {
        if (activeTab === 'channels') return 'Search channels...'
        return 'Search conversations...'
    }

    return (
        <div className="alpha-sidebar w-80 h-full flex flex-col bg-[#0d1117] border-r border-[#39ff14]/10">
            {/* Header / Brand */}
            <div className="flex-shrink-0 p-4 pb-2">
                <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#39ff14]/5 transition-colors mb-4"
                >
                    <div className="flex items-center gap-2">
                        <FaTerminal className="w-5 h-5 text-[#39ff14]" />
                        <span className="text-lg font-bold text-white">
                            Alpha<span className="text-[#39ff14]">Chats</span>
                        </span>
                    </div>
                    <HiChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Custom Tabs - Hidden when in New Chat mode */}
                {!showNewChat && (
                    <div className="grid grid-cols-2 gap-2 mb-4 px-1">
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${activeTab === 'chats'
                                ? 'bg-[#39ff14] text-black font-bold shadow-[0_0_10px_rgba(57,255,20,0.3)]'
                                : 'text-gray-400 hover:text-white bg-[#39ff14]/5 hover:bg-[#39ff14]/10'
                                }`}
                        >
                            <HiChatAlt2 className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs font-medium">Chats</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('channels')}
                            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all ${activeTab === 'channels'
                                ? 'bg-[#39ff14] text-black font-bold shadow-[0_0_10px_rgba(57,255,20,0.3)]'
                                : 'text-gray-400 hover:text-white bg-[#39ff14]/5 hover:bg-[#39ff14]/10'
                                }`}
                        >
                            <HiHashtag className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs font-medium">Channels</span>
                        </button>
                    </div>
                )}

                {/* Search Bar Row */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiSearch className="h-4 w-4 text-[#39ff14]/70" />
                        </div>
                        <input
                            type="text"
                            placeholder={getSearchPlaceholder()}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#0d1117] border border-[#39ff14]/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14] transition-all"
                        />
                    </div>
                    <button
                        className="p-2 text-[#39ff14] border border-[#39ff14]/20 rounded-lg hover:bg-[#39ff14]/10 transition-colors flex-shrink-0"
                        onClick={() => {/* Refresh logic if needed */ }}
                    >
                        <HiRefresh className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area - Fixed overflow handling */}
            <div className="flex-1 px-2 pb-2 flex flex-col relative min-h-0">
                {!showNewChat && (
                    <>
                        {/* CHANNELS VIEW - Needs its own scroll container */}
                        {activeTab === 'channels' && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 mt-2 min-h-0">
                                {filteredChannels.length === 0 ? (
                                    <div className="text-center text-gray-500 text-sm mt-8">
                                        No channels found
                                    </div>
                                ) : (
                                    filteredChannels.map(channel => {
                                        const canAccess = channel.isMember || user?.role === 'cofounder' || user?.role === 'core'
                                        const isActive = activeChannel?._id === channel._id

                                        return (
                                            <div
                                                key={channel._id}
                                                onClick={() => canAccess && handleChannelClick(channel)}
                                                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${isActive
                                                    ? 'bg-[#39ff14] text-black font-medium shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                                                    : canAccess ? 'text-gray-300 hover:bg-[#39ff14]/10 hover:text-white' : 'text-gray-600 opacity-60 cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <span className={`text-lg ${isActive ? 'text-black/70' : 'text-[#39ff14]'}`}>#</span>
                                                    <span className="truncate">{channel.name}</span>
                                                </div>

                                                {!channel.isMember && user?.role !== 'cofounder' && user?.role !== 'core' && (
                                                    <button
                                                        onClick={(e) => handleJoinChannel(channel, e)}
                                                        className={`text-xs px-2 py-0.5 rounded border ${isActive
                                                            ? 'border-black/20 text-black hover:bg-black/10'
                                                            : 'border-[#39ff14]/30 text-[#39ff14] hover:bg-[#39ff14]/20'
                                                            }`}
                                                    >
                                                        Join
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        {/* CHATS VIEW (Active DMs) - DMList handles scrolling */}
                        {activeTab === 'chats' && (
                            <div className="h-full">
                                <DMList
                                    searchQuery={searchQuery}
                                    isNewChatMode={false}
                                />
                            </div>
                        )}

                        {/* Floating Action Button (FAB) */}
                        <button
                            onClick={() => setShowNewChat(true)}
                            className="fixed bottom-6 right-6 w-12 h-12 bg-[#39ff14] text-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.4)] hover:shadow-[0_0_20px_rgba(57,255,20,0.6)] hover:scale-110 transition-all z-50 group"
                        >
                            <HiPlus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </>
                )}

                {/* New Chat Overlay */}
                {showNewChat && (
                    <div className="flex-1 flex flex-col bg-[#0d1117] z-30 animate-fadeIn overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-3 border-b border-[#39ff14]/10 bg-[#0d1117] flex-shrink-0">
                            <span className="text-[#39ff14] font-bold text-sm uppercase tracking-wider">New Chat</span>
                            <button
                                onClick={() => setShowNewChat(false)}
                                className="p-2 rounded-lg hover:bg-[#39ff14]/10 text-[#39ff14] hover:text-white transition-colors border border-[#39ff14]/20 hover:border-[#39ff14]/40"
                                title="Back to Chats"
                            >
                                <HiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <DMList
                                searchQuery={searchQuery}
                                isNewChatMode={true}
                                onCloseNewChat={() => setShowNewChat(false)}
                                onSwitchToChats={() => setActiveTab('chats')}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Footer */}
            <div className="mt-auto flex-shrink-0 p-3 pb-3 mb-2 bg-[#0d1117] border-t border-[#39ff14]/10 z-30 shadow-[0_-10px_20px_rgba(13,17,23,0.8)]">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#39ff14]/5 cursor-pointer transition-colors">
                    <div className="relative">
                        <img
                            src={user?.avatar}
                            alt={user?.displayName}
                            className="w-10 h-10 rounded-lg border border-[#39ff14]/20"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#39ff14] rounded-full border-2 border-[#0d1117] shadow-[0_0_5px_#39ff14]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user?.displayName}</p>
                        <p className="text-xs text-[#39ff14]/70 truncate">@{user?.username}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Sidebar
