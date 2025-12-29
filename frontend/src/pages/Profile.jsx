import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaGithub, FaMapMarkerAlt, FaBuilding, FaSignOutAlt } from 'react-icons/fa'
import { HiArrowLeft } from 'react-icons/hi'
import axios from '../config/axios'
import { ENDPOINTS } from '../config/api'

const Profile = () => {
    const navigate = useNavigate()
    const { user } = useSelector(state => state.user)

    const handleLogout = async () => {
        try {
            await axios.post(ENDPOINTS.AUTH.LOGOUT)
            window.location.href = '/'
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    if (!user) return null

    const roleColors = {
        cofounder: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        core: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        member: 'bg-primary-500/20 text-primary-400 border-primary-500/30'
    }

    const roleLabels = {
        cofounder: '👑 Co-founder',
        core: '⭐ Core Team',
        member: '👤 Member'
    }

    return (
        <div className="min-h-screen bg-telegram-chat">
            {/* Header */}
            <header className="bg-telegram-sidebar border-b border-white/10 p-4">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate('/chat')}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <HiArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <h1 className="text-lg font-semibold text-white">Your Profile</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-2xl mx-auto p-6">
                {/* Profile Card */}
                <div className="bg-telegram-sidebar rounded-2xl p-6 border border-white/10">
                    {/* Avatar and Name */}
                    <div className="flex items-center gap-4 mb-6">
                        <img
                            src={user.avatar}
                            alt={user.displayName}
                            className="w-20 h-20 rounded-full border-2 border-primary-500"
                        />
                        <div>
                            <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
                            <p className="text-gray-400">@{user.username}</p>
                            <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full border ${roleColors[user.role]}`}>
                                {roleLabels[user.role]}
                            </span>
                        </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <p className="text-gray-300 mb-6">{user.bio}</p>
                    )}

                    {/* Info */}
                    <div className="space-y-3 mb-6">
                        {user.company && (
                            <div className="flex items-center gap-3 text-gray-400">
                                <FaBuilding className="w-4 h-4" />
                                <span>{user.company}</span>
                            </div>
                        )}
                        {user.location && (
                            <div className="flex items-center gap-3 text-gray-400">
                                <FaMapMarkerAlt className="w-4 h-4" />
                                <span>{user.location}</span>
                            </div>
                        )}
                        <a
                            href={user.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
                        >
                            <FaGithub className="w-4 h-4" />
                            <span>View GitHub Profile</span>
                        </a>
                    </div>

                    {/* Joined Channels */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Joined Channels</h3>
                        <div className="flex flex-wrap gap-2">
                            {user.joinedChannels?.map(channel => (
                                <span
                                    key={channel._id}
                                    className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-sm"
                                >
                                    {channel.icon} {channel.name}
                                </span>
                            ))}
                            {(!user.joinedChannels || user.joinedChannels.length === 0) && (
                                <span className="text-gray-500 text-sm">No channels joined yet</span>
                            )}
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        <FaSignOutAlt className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </main>
        </div>
    )
}

export default Profile
