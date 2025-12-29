import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { HiUsers, HiDotsVertical, HiStar, HiOutlineStar } from 'react-icons/hi'
import { FaPaperPlane, FaCode, FaPaperclip, FaBold, FaItalic, FaStrikethrough, FaLink, FaListUl, FaListOl } from 'react-icons/fa'
import { HiEmojiHappy } from 'react-icons/hi'
import axios from '../../config/axios'
import { ENDPOINTS } from '../../config/api'
import { setChannelMessages, addChannelMessage, setDMMessages, addDMMessage, setLoadingMessages } from '../../redux/chatSlice'
import { getSocket, sendTyping } from '../../hooks/useSocket'
import MessageItem from './MessageItem'
import LoadingSpinner from '../Common/LoadingSpinner'

const ChatArea = () => {
    const dispatch = useDispatch()
    const messagesEndRef = useRef(null)
    const messagesContainerRef = useRef(null)
    const { user } = useSelector(state => state.user)
    const { activeChannel, activeConversation, channelMessages, dmMessages, typingUsers, isLoadingMessages } = useSelector(state => state.chat)

    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('text')
    const [isSending, setIsSending] = useState(false)
    const [isStarred, setIsStarred] = useState(false)

    // Auto-detect programming language from code content
    const detectLanguage = (code) => {
        if (/\b(def |import |from |print\(|if __name__|elif |lambda )/.test(code)) return 'python'
        if (/\b(const |let |var |function |=>|console\.|require\(|export )/.test(code)) return 'javascript'
        if (/\b(interface |type |: string|: number|: boolean)/.test(code)) return 'typescript'
        if (/\b(public class|public static void|System\.out|private |protected )/.test(code)) return 'java'
        if (/\b(#include|int main|printf\(|scanf\(|void \*)/.test(code)) return 'c'
        if (/\b(std::|cout|cin|namespace )/.test(code)) return 'cpp'
        if (/\b(using System|namespace |Console\.Write)/.test(code)) return 'csharp'
        if (/\b(package main|func |fmt\.)/.test(code)) return 'go'
        if (/\b(fn |let mut|impl |pub fn|println!)/.test(code)) return 'rust'
        if (/\b(def |end$|puts |require ')/.test(code)) return 'ruby'
        if (/\b(SELECT |FROM |WHERE |INSERT INTO|CREATE TABLE)/.test(code)) return 'sql'
        if (/section \.|mov |syscall|global _start|eax|ebx|rax|rdi/.test(code)) return 'nasm'
        if (/#!.*\b(bash|sh)\b|echo |sudo |apt |npm run/.test(code)) return 'bash'
        return 'text'
    }

    const isChannel = !!activeChannel
    const chatId = isChannel ? activeChannel._id : activeConversation?._id
    const messages = isChannel ? channelMessages[chatId] : dmMessages[chatId]
    const typingInChat = typingUsers[chatId] || {}

    // Fetch messages when chat changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatId) return

            dispatch(setLoadingMessages(true))

            try {
                if (isChannel) {
                    const res = await axios.get(ENDPOINTS.CHANNELS.GET(activeChannel.slug))
                    if (res.data.success) {
                        dispatch(setChannelMessages({ channelId: chatId, messages: res.data.messages }))
                    }
                } else {
                    const recipientId = activeConversation.otherUser._id
                    const res = await axios.get(ENDPOINTS.MESSAGES.DM(recipientId))
                    if (res.data.success) {
                        dispatch(setDMMessages({ conversationId: chatId, messages: res.data.messages }))
                    }
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error)
            } finally {
                dispatch(setLoadingMessages(false))
            }
        }

        fetchMessages()
    }, [chatId, isChannel, activeChannel, activeConversation, dispatch])

    // Socket listeners for real-time messages
    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        const handleChannelMessage = (data) => {
            if (data.channelId === activeChannel?._id) {
                dispatch(addChannelMessage({ channelId: data.channelId, message: data.message }))
            }
        }

        const handleDirectMessage = (data) => {
            if (activeConversation) {
                dispatch(addDMMessage({ conversationId: activeConversation._id, message: data.message }))
            }
        }

        socket.on('channelMessage', handleChannelMessage)
        socket.on('directMessage', handleDirectMessage)

        return () => {
            socket.off('channelMessage', handleChannelMessage)
            socket.off('directMessage', handleDirectMessage)
        }
    }, [activeChannel, activeConversation, dispatch])

    // Scroll to bottom on new messages - using direct scrollTop to avoid scrolling parent containers
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!message.trim() || isSending) return

        setIsSending(true)

        try {
            if (isChannel) {
                const res = await axios.post(ENDPOINTS.MESSAGES.CHANNEL(activeChannel._id), {
                    content: message.trim(),
                    messageType
                })

                if (res.data.success) {
                    dispatch(addChannelMessage({ channelId: activeChannel._id, message: res.data.message }))
                    setMessage('')
                }
            } else {
                const recipientId = activeConversation.otherUser._id
                const res = await axios.post(ENDPOINTS.MESSAGES.DM(recipientId), {
                    content: message.trim(),
                    messageType
                })

                if (res.data.success) {
                    dispatch(addDMMessage({ conversationId: activeConversation._id, message: res.data.message }))
                    setMessage('')
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error)
            alert('Failed to send message. You may need to join this channel first.')
        } finally {
            setIsSending(false)
        }
    }

    const handleTyping = (isTyping) => {
        sendTyping({
            channelId: isChannel ? activeChannel._id : null,
            recipientId: !isChannel ? activeConversation.otherUser._id : null,
            senderId: user.id,
            senderName: user.displayName,
            isTyping
        })
    }

    // Header info
    const headerTitle = isChannel ? activeChannel.name : activeConversation?.otherUser?.displayName
    const headerSubtitle = isChannel
        ? `${activeChannel.memberCount || 0} members`
        : activeConversation?.otherUser?.isOnline ? 'Active now' : 'Away'
    const headerAvatar = !isChannel ? activeConversation?.otherUser?.avatar : null

    return (
        <div className="flex-1 flex flex-col bg-[#0a0a0a] h-full overflow-hidden min-h-0">
            {/* Slack-style Header */}
            <div className="slack-chat-header">
                <div className="slack-chat-title">
                    <div>
                        <h2>
                            {isChannel && <span className="hash">#</span>}
                            {!isChannel && headerAvatar && (
                                <img src={headerAvatar} alt={headerTitle} className="w-6 h-6 rounded-lg inline mr-2" />
                            )}
                            {headerTitle}
                        </h2>
                        <p className="slack-chat-meta">{headerSubtitle}</p>
                    </div>
                    <button
                        className={`slack-chat-star ml-2 ${isStarred ? 'active' : ''}`}
                        onClick={() => setIsStarred(!isStarred)}
                    >
                        {isStarred ? <HiStar className="w-5 h-5" /> : <HiOutlineStar className="w-5 h-5" />}
                    </button>
                </div>
                <div className="slack-chat-actions">
                    {isChannel && (
                        <button className="slack-header-btn">
                            <HiUsers className="w-5 h-5" />
                        </button>
                    )}
                    <button className="slack-header-btn">
                        <HiDotsVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
                {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                        <LoadingSpinner message="Loading messages..." />
                    </div>
                ) : messages && messages.length > 0 ? (
                    <div className="py-4">
                        {messages.map((msg, index) => (
                            <MessageItem
                                key={msg._id}
                                message={msg}
                                isOwn={msg.sender._id === user.id || msg.sender === user.id}
                                showAvatar={
                                    index === 0 ||
                                    (messages[index - 1]?.sender._id || messages[index - 1]?.sender) !== (msg.sender._id || msg.sender)
                                }
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="slack-empty-state">
                        <div className="slack-empty-icon">
                            {isChannel ? '#' : '💬'}
                        </div>
                        <h3 className="slack-empty-title">
                            {isChannel ? `Welcome to #${headerTitle}` : `Chat with ${headerTitle}`}
                        </h3>
                        <p className="slack-empty-subtitle">
                            This is the start of your conversation. Send a message to begin!
                        </p>
                    </div>
                )}

                {/* Typing Indicator */}
                {Object.keys(typingInChat).length > 0 && (
                    <div className="flex items-center gap-2 px-5 py-2 text-gray-400 text-sm">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#39ff14] typing-dot" />
                            <div className="w-2 h-2 rounded-full bg-[#39ff14] typing-dot" />
                            <div className="w-2 h-2 rounded-full bg-[#39ff14] typing-dot" />
                        </div>
                        <span className="text-xs">{Object.values(typingInChat).join(', ')} is typing...</span>
                    </div>
                )}
            </div>

            {/* Slack-style Input */}
            {(isChannel ? activeChannel.isMember || user.role === 'cofounder' || user.role === 'core' : true) ? (
                <div className="slack-input-container">
                    <form onSubmit={handleSendMessage}>
                        <div className="slack-input-wrapper">
                            {/* Toolbar */}
                            <div className="slack-input-toolbar">
                                <button type="button" className="slack-toolbar-btn" title="Bold">
                                    <FaBold />
                                </button>
                                <button type="button" className="slack-toolbar-btn" title="Italic">
                                    <FaItalic />
                                </button>
                                <button type="button" className="slack-toolbar-btn" title="Strikethrough">
                                    <FaStrikethrough />
                                </button>
                                <div className="slack-toolbar-divider" />
                                <button type="button" className="slack-toolbar-btn" title="Link">
                                    <FaLink />
                                </button>
                                <button type="button" className="slack-toolbar-btn" title="Bulleted list">
                                    <FaListUl />
                                </button>
                                <button type="button" className="slack-toolbar-btn" title="Numbered list">
                                    <FaListOl />
                                </button>
                                <div className="slack-toolbar-divider" />
                                <button
                                    type="button"
                                    className={`slack-toolbar-btn ${messageType === 'code' ? 'active' : ''}`}
                                    onClick={() => setMessageType(messageType === 'text' ? 'code' : 'text')}
                                    title="Code block"
                                >
                                    <FaCode />
                                </button>
                            </div>

                            {/* Input Area */}
                            <div className="slack-input-area">
                                <button type="button" className="slack-toolbar-btn" title="Attach file">
                                    <FaPaperclip />
                                </button>
                                <textarea
                                    value={message}
                                    onChange={(e) => {
                                        setMessage(e.target.value)
                                        handleTyping(e.target.value.length > 0)
                                    }}
                                    onBlur={() => handleTyping(false)}
                                    placeholder={`Message ${isChannel ? '#' + headerTitle : headerTitle}`}
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage(e)
                                        }
                                    }}
                                />
                                <button type="button" className="slack-toolbar-btn" title="Add emoji">
                                    <HiEmojiHappy className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={!message.trim() || isSending}
                                    className="slack-send-btn"
                                    title="Send message"
                                >
                                    <FaPaperPlane className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {messageType === 'code' && (
                            <p className="text-xs text-[#39ff14]/70 mt-2 ml-2">
                                Code mode enabled - your message will be formatted as code
                            </p>
                        )}
                    </form>
                </div>
            ) : (
                <div className="p-4 border-t border-[#39ff14]/10 text-center">
                    <p className="text-gray-500 text-sm">Join this channel to send messages</p>
                </div>
            )}
        </div>
    )
}

export default ChatArea
