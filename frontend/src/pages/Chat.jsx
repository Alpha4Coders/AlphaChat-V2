import { useEffect, useRef, useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaHashtag } from 'react-icons/fa'
import { gsap } from 'gsap'
import axios from '../config/axios'
import { ENDPOINTS } from '../config/api'
import { setChannels, setConversations, setLoadingChannels } from '../redux/chatSlice'
import Sidebar from '../components/Sidebar/Sidebar'
import ChatArea from '../components/Chat/ChatArea'

const Chat = () => {
    const dispatch = useDispatch()
    const containerRef = useRef(null)
    const { activeChannel, activeConversation } = useSelector(state => state.chat)

    console.log('Chat.jsx render - activeChannel:', activeChannel, 'activeConversation:', activeConversation)

    // GSAP entrance animation - with clearProps to prevent layout issues
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(containerRef.current,
                { opacity: 0 },
                {
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                    clearProps: 'all' // Prevent leftover GSAP styles
                }
            )
        })
        return () => ctx.revert()
    }, [])

    // Fetch channels and conversations on mount
    useEffect(() => {
        const fetchData = async () => {
            dispatch(setLoadingChannels(true))

            try {
                // Fetch channels
                const channelsRes = await axios.get(ENDPOINTS.CHANNELS.LIST)
                if (channelsRes.data.success) {
                    dispatch(setChannels(channelsRes.data.channels))
                }

                // Fetch conversations
                const convoRes = await axios.get(ENDPOINTS.MESSAGES.CONVERSATIONS)
                if (convoRes.data.success) {
                    dispatch(setConversations(convoRes.data.conversations))
                }
            } catch (error) {
                console.error('Failed to fetch data:', error)
            }
        }

        fetchData()
    }, [dispatch])

    return (
        <div ref={containerRef} className="h-[100dvh] w-screen flex overflow-hidden bg-[#0a0a0a]">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeChannel || activeConversation ? (
                    <ChatArea />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
                        <div className="slack-empty-state">
                            <div className="slack-empty-icon">
                                <FaHashtag />
                            </div>
                            <h2 className="slack-empty-title">
                                Welcome to Alpha<span className="text-[#39ff14]">Chats</span>
                            </h2>
                            <p className="slack-empty-subtitle">
                                Select a channel or start a conversation from the sidebar
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Chat
