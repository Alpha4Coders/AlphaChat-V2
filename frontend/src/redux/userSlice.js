import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload
            state.isAuthenticated = !!action.payload
            state.isLoading = false
            state.error = null
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
            state.isLoading = false
        },
        logout: (state) => {
            state.user = null
            state.isAuthenticated = false
            state.isLoading = false
            state.error = null
        },
        updateUserStatus: (state, action) => {
            if (state.user) {
                state.user.status = action.payload.status
                state.user.isOnline = action.payload.isOnline
            }
        },
        addJoinedChannel: (state, action) => {
            if (state.user && !state.user.joinedChannels.find(c => c._id === action.payload._id)) {
                state.user.joinedChannels.push(action.payload)
            }
        },
        removeJoinedChannel: (state, action) => {
            if (state.user) {
                state.user.joinedChannels = state.user.joinedChannels.filter(
                    c => c._id !== action.payload
                )
            }
        }
    }
})

export const {
    setUser,
    setLoading,
    setError,
    logout,
    updateUserStatus,
    addJoinedChannel,
    removeJoinedChannel
} = userSlice.actions

export default userSlice.reducer
