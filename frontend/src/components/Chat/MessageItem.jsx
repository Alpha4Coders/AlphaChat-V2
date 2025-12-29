import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FaCrown, FaStar, FaCopy, FaCheck } from 'react-icons/fa'
import { HiEmojiHappy, HiReply, HiBookmark, HiDotsHorizontal } from 'react-icons/hi'

const MessageItem = ({ message, isOwn, showAvatar }) => {
    const { sender, content, messageType, codeLanguage, createdAt, imageUrl, files } = message
    const [copied, setCopied] = useState(false)

    const senderName = sender?.displayName || sender?.username || 'Unknown'
    const senderAvatar = sender?.avatar || ''
    const senderRole = sender?.role

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

    const roleIcons = {
        cofounder: <FaCrown className="w-3 h-3 text-amber-400" />,
        core: <FaStar className="w-3 h-3 text-[#39ff14]" />
    }

    return (
        <div className="slack-message group">
            {/* Hover Actions */}
            <div className="slack-message-actions">
                <button className="slack-action-btn" title="Add reaction">
                    <HiEmojiHappy />
                </button>
                <button className="slack-action-btn" title="Reply in thread">
                    <HiReply />
                </button>
                <button className="slack-action-btn" title="Bookmark">
                    <HiBookmark />
                </button>
                <button className="slack-action-btn" title="More actions">
                    <HiDotsHorizontal />
                </button>
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
                        <span className="slack-message-time">{formatTime(createdAt)}</span>
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
        </div>
    )
}

export default MessageItem
