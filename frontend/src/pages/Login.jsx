import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaGithub, FaTerminal, FaCode } from 'react-icons/fa'
import { ENDPOINTS } from '../config/api'

const Login = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const error = searchParams.get('error')

    const handleGitHubLogin = () => {
        window.location.href = ENDPOINTS.AUTH.GITHUB
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
            {/* Matrix Grid Background */}
            <div className="matrix-grid">
                {Array.from({ length: 200 }, (_, i) => (
                    <div
                        key={i}
                        className="matrix-cell"
                        style={{
                            animationDelay: `${i * 0.02}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Ambient Glow Orbs */}
            <div className="ambient-orb orb-green w-64 h-64 top-20 left-20 animate-pulse-glow" />
            <div className="ambient-orb orb-purple w-48 h-48 bottom-20 right-20 animate-pulse-glow" style={{ animationDelay: '1s' }} />

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Terminal Window */}
                <div className="terminal-window">
                    {/* Terminal Header */}
                    <div className="terminal-header">
                        <div className="terminal-dot red" />
                        <div className="terminal-dot yellow" />
                        <div className="terminal-dot green" />
                        <div className="flex-1 text-center">
                            <span className="text-[#b3b3ff] font-mono text-sm">alpha-chat@terminal ~ login</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <FaTerminal className="text-[#39ff14] text-2xl animate-pulse" />
                                <h1 className="text-2xl font-bold font-mono">
                                    Alpha<span className="gradient-text">Chats</span>
                                </h1>
                                <FaCode className="text-[#7f53ac] text-2xl animate-pulse" />
                            </div>
                            <p className="text-[#b3b3ff] font-mono text-sm">
                                <span className="text-[#39ff14]">$</span> sudo login --developer-mode
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-[#ff6f3c]/10 border border-[#ff6f3c]/30 font-mono">
                                <p className="text-[#ff6f3c] text-sm text-center">
                                    ⚠️ {error === 'auth_failed'
                                        ? 'GitHub authentication failed. Please try again.'
                                        : 'An error occurred. Please try again.'}
                                </p>
                            </div>
                        )}

                        {/* GitHub Login Button */}
                        <button
                            onClick={handleGitHubLogin}
                            className="btn-github w-full flex items-center justify-center gap-3 font-mono mb-4"
                        >
                            <FaGithub className="w-6 h-6" />
                            <span>Sign in with GitHub</span>
                        </button>

                        <div className="text-center text-[#7f7fa8] text-sm font-mono space-y-1">
                            <p><span className="text-[#39ff14]">→</span> Secure GitHub OAuth 2.0</p>
                            <p><span className="text-[#39ff14]">→</span> No password required</p>
                        </div>

                        {/* Back Link */}
                        <div className="mt-8 pt-6 border-t border-[rgba(57,255,20,0.2)] text-center">
                            <button
                                onClick={() => navigate('/')}
                                className="text-[#b3b3ff] hover:text-[#39ff14] font-mono text-sm transition-colors"
                            >
                                <span className="text-[#39ff14]">←</span> Back to home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
