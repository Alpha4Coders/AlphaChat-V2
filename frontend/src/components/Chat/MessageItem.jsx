import { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FaCrown, FaStar, FaCopy, FaCheck, FaEdit, FaTrash, FaThumbtack, FaLink } from 'react-icons/fa'
import { HiEmojiHappy, HiReply, HiBookmark, HiDotsHorizontal } from 'react-icons/hi'
import axios from '../../config/axios'
import { ENDPOINTS } from '../../config/api'
import { updateMessageReactions, addSavedMessage, removeSavedMessage, updateChannelMessage } from '../../redux/chatSlice'

// Available reactions
const EMOJI_OPTIONS = ['👍', '👎', '❤️', '😂', '😮', '🎉', '🚀', '👀']

const MessageItem = ({ message, isOwn, showAvatar, channelId, onEdit, onDelete, onPin }) => {
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.user)
    const { savedMessageIds } = useSelector(state => state.chat)

    const { sender, content, messageType, codeLanguage, createdAt, imageUrl, files, reactions, isPinned, isEdited, _id } = message
    const [copied, setCopied] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showMoreMenu, setShowMoreMenu] = useState(false)
    const [isReacting, setIsReacting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const menuRef = useRef(null)
    const emojiRef = useRef(null)

    const senderName = sender?.displayName || sender?.username || 'Unknown'
    const senderAvatar = sender?.avatar || ''
    const senderRole = sender?.role
    const userRole = user?.role

    // Check if current user is admin (core or cofounder)
    const isAdmin = userRole === 'cofounder' || userRole === 'core'
    const isSaved = savedMessageIds.includes(_id)

    // Ensure content is always a string
    const safeContent = String(content || '')

    const formatTime = (date) => {
        try {
            const d = new Date(date)
            const now = new Date()
            const isToday = d.toDateString() === now.toDateString()

            const time = d.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })

            if (isToday) {
                return time
            }
            return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`
        } catch {
            return ''
        }
    }

    // Auto-detect language from code content
    const detectLanguage = (code) => {
        if (codeLanguage) return codeLanguage

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

    const detectedLang = messageType === 'code' ? detectLanguage(safeContent) : null

    // Copy to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(safeContent)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    // Toggle reaction
    const handleReaction = async (emoji) => {
        if (isReacting) return
        setIsReacting(true)
        setShowEmojiPicker(false)

        try {
            const res = await axios.patch(ENDPOINTS.MESSAGES.REACTION(_id), {
                emoji,
                messageType: 'channel'
            })

            if (res.data.success) {
                dispatch(updateMessageReactions({
                    channelId,
                    messageId: _id,
                    reactions: res.data.reactions
                }))
            }
        } catch (error) {
            console.error('Failed to toggle reaction:', error)
        } finally {
            setIsReacting(false)
        }
    }

    // Toggle save/bookmark
    const handleSave = async () => {
        if (isSaving) return
        setIsSaving(true)

        try {
            if (isSaved) {
                await axios.delete(ENDPOINTS.MESSAGES.SAVE(_id))
                dispatch(removeSavedMessage(_id))
            } else {
                await axios.post(ENDPOINTS.MESSAGES.SAVE(_id), { messageType: 'channel' })
                dispatch(addSavedMessage(_id))
            }
        } catch (error) {
            console.error('Failed to save/unsave message:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Edit message
    const handleEdit = () => {
        setShowMoreMenu(false)
        if (onEdit) onEdit(message)
    }

    // Delete message
    const handleDelete = async () => {
        setShowMoreMenu(false)
        if (onDelete) {
            onDelete(_id)
        } else {
            try {
                await axios.delete(ENDPOINTS.MESSAGES.DELETE(_id))
                dispatch(updateChannelMessage({
                    channelId,
                    messageId: _id,
                    updates: { isDeleted: true, content: '[Message deleted]' }
                }))
            } catch (error) {
                console.error('Failed to delete message:', error)
            }
        }
    }

    // Pin message
    const handlePin = async () => {
        setShowMoreMenu(false)
        if (onPin) {
            onPin(_id)
        } else {
            try {
                await axios.patch(ENDPOINTS.MESSAGES.PIN(_id))
                dispatch(updateChannelMessage({
                    channelId,
                    messageId: _id,
                    updates: { isPinned: !isPinned }
                }))
            } catch (error) {
                console.error('Failed to pin message:', error)
            }
        }
    }

    // Copy message link (placeholder - could be actual link)
    const handleCopyLink = () => {
        setShowMoreMenu(false)
        navigator.clipboard.writeText(`Message ID: ${_id}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const roleIcons = {
        cofounder: <FaCrown className="w-3 h-3 text-amber-400" />,
        core: <FaStar className="w-3 h-3 text-[#39ff14]" />
    }

    // Convert reactions object/map to array for display
    const getReactionsArray = () => {
        if (!reactions) return []

        // Handle both Map and Object formats
        if (reactions instanceof Map) {
            return Array.from(reactions.entries()).map(([emoji, users]) => ({
                emoji,
                count: Array.isArray(users) ? users.length : 0,
                users: Array.isArray(users) ? users : [],
                hasReacted: Array.isArray(users) && users.some(u =>
                    typeof u === 'string' ? u === user?.id : u?.toString() === user?.id
                )
            }))
        }

        return Object.entries(reactions).map(([emoji, users]) => ({
            emoji,
            count: Array.isArray(users) ? users.length : 0,
            users: Array.isArray(users) ? users : [],
            hasReacted: Array.isArray(users) && users.some(u =>
                typeof u === 'string' ? u === user?.id : u?.toString() === user?.id
            )
        }))
    }

    const reactionsArray = getReactionsArray()

    return (
        <div className={`slack-message group ${isPinned ? 'bg-amber-500/5 border-l-2 border-amber-500' : ''}`}>
            {/* Pinned indicator */}
            {isPinned && (
                <div className="absolute -top-3 left-12 text-xs text-amber-400 flex items-center gap-1">
                    <FaThumbtack className="w-2.5 h-2.5" />
                    <span>Pinned</span>
                </div>
            )}

            {/* Hover Actions */}
            <div className="slack-message-actions">
                {/* Emoji Picker Button */}
                <div className="relative" ref={emojiRef}>
                    <button
                        className="slack-action-btn"
                        title="Add reaction"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <HiEmojiHappy />
                    </button>

                    {/* Emoji Picker Dropdown */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-1 bg-[#1a1a1a] border border-[#39ff14]/20 rounded-lg p-2 flex gap-1 shadow-xl z-50">
                            {EMOJI_OPTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    className="p-1.5 hover:bg-[#39ff14]/10 rounded transition-colors text-lg"
                                    disabled={isReacting}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button className="slack-action-btn" title="Reply in thread">
                    <HiReply />
                </button>

                <button
                    className={`slack-action-btn ${isSaved ? 'text-[#39ff14]' : ''}`}
                    title={isSaved ? "Remove from saved" : "Save message"}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    <HiBookmark className={isSaved ? 'fill-current' : ''} />
                </button>

                {/* More Actions Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        className="slack-action-btn"
                        title="More actions"
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                    >
                        <HiDotsHorizontal />
                    </button>

                    {showMoreMenu && (
                        <div className="absolute bottom-full right-0 mb-1 bg-[#1a1a1a] border border-[#39ff14]/20 rounded-lg overflow-hidden shadow-xl z-50 min-w-[160px]">
                            {/* Edit - only for own messages */}
                            {isOwn && messageType !== 'code' && (
                                <button
                                    onClick={handleEdit}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#39ff14]/10 transition-colors"
                                >
                                    <FaEdit className="w-3.5 h-3.5" />
                                    Edit message
                                </button>
                            )}

                            {/* Delete - for own messages or admins */}
                            {(isOwn || isAdmin) && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <FaTrash className="w-3.5 h-3.5" />
                                    Delete message
                                </button>
                            )}

                            {/* Pin - only for admins */}
                            {isAdmin && (
                                <button
                                    onClick={handlePin}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                                >
                                    <FaThumbtack className="w-3.5 h-3.5" />
                                    {isPinned ? 'Unpin message' : 'Pin message'}
                                </button>
                            )}

                            <div className="border-t border-gray-700 my-1" />

                            {/* Copy link */}
                            <button
                                onClick={handleCopyLink}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#39ff14]/10 transition-colors"
                            >
                                <FaLink className="w-3.5 h-3.5" />
                                Copy link
                            </button>

                            {/* Copy text */}
                            <button
                                onClick={() => { handleCopy(); setShowMoreMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#39ff14]/10 transition-colors"
                            >
                                <FaCopy className="w-3.5 h-3.5" />
                                Copy text
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Avatar */}
            {showAvatar ? (
                <img
                    src={senderAvatar}
                    alt={senderName}
                    className="slack-message-avatar"
                />
            ) : (
                <div className="w-9 flex-shrink-0" />
            )}

            {/* Message Content */}
            <div className="slack-message-content">
                {/* Header - only show for first message in group */}
                {showAvatar && (
                    <div className="slack-message-header">
                        <span className="slack-message-sender">
                            {senderName}
                            {roleIcons[senderRole] && (
                                <span className="slack-role-badge">{roleIcons[senderRole]}</span>
                            )}
                        </span>
                        <span className="slack-message-time">
                            {formatTime(createdAt)}
                            {isEdited && <span className="text-gray-500 ml-1">(edited)</span>}
                        </span>
                    </div>
                )}

                {/* Content */}
                {messageType === 'code' ? (
                    <div className="mt-1 overflow-hidden rounded-lg border border-[#39ff14]/15 max-w-full">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 text-xs font-mono text-gray-400">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="ml-2 text-[#39ff14]">{detectedLang}</span>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                title="Copy code"
                            >
                                {copied ? (
                                    <>
                                        <FaCheck className="w-3 h-3 text-[#39ff14]" />
                                        <span className="text-[#39ff14]">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <FaCopy className="w-3 h-3" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <SyntaxHighlighter
                                language={detectedLang || 'javascript'}
                                style={atomDark}
                                customStyle={{
                                    margin: 0,
                                    padding: '0.75rem',
                                    fontSize: '0.8rem',
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    borderRadius: '0 0 0.5rem 0.5rem',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}
                                wrapLongLines={false}
                            >
                                {safeContent}
                            </SyntaxHighlighter>
                        </div>
                    </div>
                ) : messageType === 'image' && imageUrl ? (
                    <div className="mt-1">
                        <img
                            src={imageUrl}
                            alt="Shared image"
                            className="rounded-lg max-w-md cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(imageUrl, '_blank')}
                        />
                        {safeContent && <p className="slack-message-text mt-2">{safeContent}</p>}
                    </div>
                ) : (
                    <p className="slack-message-text">{safeContent}</p>
                )}

                {/* Reactions Display */}
                {reactionsArray.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {reactionsArray.map(({ emoji, count, hasReacted }) => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className={`
                                    flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                                    border transition-colors
                                    ${hasReacted
                                        ? 'bg-[#39ff14]/20 border-[#39ff14]/40 text-[#39ff14]'
                                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
                                    }
                                `}
                                disabled={isReacting}
                            >
                                <span>{emoji}</span>
                                <span>{count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Files */}
                {files && files.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {files.map((file, index) => (
                            <a
                                key={index}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 bg-[#39ff14]/5 border border-[#39ff14]/10 rounded-lg hover:bg-[#39ff14]/10 transition-colors text-xs font-mono text-gray-300"
                            >
                                <span>{file.name}</span>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Click outside handlers */}
            {(showEmojiPicker || showMoreMenu) && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setShowEmojiPicker(false)
                        setShowMoreMenu(false)
                    }}
                />
            )}
        </div>
    )
}

export default MessageItem
