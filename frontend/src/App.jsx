import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import useAuth from './hooks/useAuth'
import { initSocket, disconnectSocket } from './hooks/useSocket'
import LoadingSpinner from './components/Common/LoadingSpinner'

// Lazy load pages
const Welcome = lazy(() => import('./pages/Welcome'))
const Login = lazy(() => import('./pages/Login'))
const Chat = lazy(() => import('./pages/Chat'))
const Profile = lazy(() => import('./pages/Profile'))

function App() {
    const dispatch = useDispatch()
    const { user, isAuthenticated, isLoading } = useSelector(state => state.user)

    // Check auth on mount
    useAuth()

    // Initialize socket when authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            initSocket(user.id)
        }

        return () => {
            disconnectSocket()
        }
    }, [isAuthenticated, user])

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-telegram-chat">
                <LoadingSpinner size="lg" message="Loading Alpha Chats..." />
            </div>
        )
    }

    return (
        <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-telegram-chat">
                <LoadingSpinner size="lg" message="Loading..." />
            </div>
        }>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/"
                    element={!isAuthenticated ? <Welcome /> : <Navigate to="/chat" replace />}
                />
                <Route
                    path="/login"
                    element={!isAuthenticated ? <Login /> : <Navigate to="/chat" replace />}
                />

                {/* Protected routes */}
                <Route
                    path="/chat"
                    element={isAuthenticated ? <Chat /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/profile"
                    element={isAuthenticated ? <Profile /> : <Navigate to="/" replace />}
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    )
}

export default App
