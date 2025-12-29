import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

let socket = null;

export const initSocket = (userId) => {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
        if (userId) {
            socket.emit('join', userId);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinChannel = (channelId) => {
    if (socket?.connected) {
        socket.emit('joinChannel', channelId);
    }
};

export const leaveChannel = (channelId) => {
    if (socket?.connected) {
        socket.emit('leaveChannel', channelId);
    }
};

export const sendTyping = (data) => {
    if (socket?.connected) {
        socket.emit('typing', data);
    }
};

export default { initSocket, getSocket, disconnectSocket, joinChannel, leaveChannel, sendTyping };
