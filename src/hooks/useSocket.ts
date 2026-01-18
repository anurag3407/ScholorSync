'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { SOCKET_EVENTS, type SendMessagePayload, type TypingPayload } from '@/lib/socket/socketEvents';
import type { RoomMessage, UserRole } from '@/types/fellowships';

interface UseSocketOptions {
    roomId: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    onNewMessage?: (message: RoomMessage) => void;
    onUserTyping?: (data: { userId: string; userName: string; isTyping: boolean }) => void;
    onUserJoined?: (data: { userId: string; userName: string; userRole: UserRole }) => void;
    onUserLeft?: (data: { userId: string; userName: string; userRole: UserRole }) => void;
    onRoomUsers?: (users: Array<{ id: string; name: string; role: UserRole }>) => void;
}

interface UseSocketReturn {
    isConnected: boolean;
    sendMessage: (content: string, type?: 'text' | 'file' | 'milestone', attachmentUrl?: string, attachmentName?: string) => string | null;
    sendFileMessage: (attachmentUrl: string, attachmentName: string) => string | null;
    startTyping: () => void;
    stopTyping: () => void;
    onlineUsers: Array<{ id: string; name: string; role: UserRole }>;
}

export function useSocket({
    roomId,
    userId,
    userName,
    userRole,
    onNewMessage,
    onUserTyping,
    onUserJoined,
    onUserLeft,
    onRoomUsers,
}: UseSocketOptions): UseSocketReturn {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; name: string; role: UserRole }>>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Use refs for callbacks to avoid stale closures
    const onNewMessageRef = useRef(onNewMessage);
    const onUserTypingRef = useRef(onUserTyping);
    const onUserJoinedRef = useRef(onUserJoined);
    const onUserLeftRef = useRef(onUserLeft);
    const onRoomUsersRef = useRef(onRoomUsers);

    // Keep refs updated
    useEffect(() => {
        onNewMessageRef.current = onNewMessage;
        onUserTypingRef.current = onUserTyping;
        onUserJoinedRef.current = onUserJoined;
        onUserLeftRef.current = onUserLeft;
        onRoomUsersRef.current = onRoomUsers;
    }, [onNewMessage, onUserTyping, onUserJoined, onUserLeft, onRoomUsers]);

    // Initialize socket connection
    useEffect(() => {
        if (!roomId || !userId) return;

        // Create socket connection - use external socket server URL if configured
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socket;

        // Function to join room
        const joinRoom = () => {
            socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
                roomId,
                userId,
                userName,
                userRole,
            });
            console.log('[Socket] Joined room:', roomId);
        };

        // Connection handlers
        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            setIsConnected(true);
            // Join the room on connect
            joinRoom();
        });

        // Re-join room on reconnect
        socket.on('reconnect', () => {
            console.log('[Socket] Reconnected');
            setIsConnected(true);
            joinRoom();
            toast.success('Connection restored', {
                description: 'You are back online and messages will sync.',
                duration: 3000,
            });
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            setIsConnected(false);
        });

        // Message handlers - use refs to get latest callback
        socket.on(SOCKET_EVENTS.NEW_MESSAGE, (message: RoomMessage) => {
            console.log('[Socket] New message received:', message.id);
            onNewMessageRef.current?.(message);
        });

        // Typing handlers
        socket.on(SOCKET_EVENTS.USER_TYPING, (data) => {
            onUserTypingRef.current?.(data);
        });

        // User presence handlers
        socket.on(SOCKET_EVENTS.USER_JOINED, (data) => {
            console.log('[Socket] User joined:', data.userName);
            setOnlineUsers((prev) => {
                if (prev.some((u) => u.id === data.userId)) return prev;
                return [...prev, { id: data.userId, name: data.userName, role: data.userRole }];
            });
            onUserJoinedRef.current?.(data);
        });

        socket.on(SOCKET_EVENTS.USER_LEFT, (data) => {
            console.log('[Socket] User left:', data.userName);
            setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
            onUserLeftRef.current?.(data);
        });

        socket.on(SOCKET_EVENTS.ROOM_USERS, (data) => {
            console.log('[Socket] Room users:', data.users?.length || 0);
            setOnlineUsers(data.users || []);
            onRoomUsersRef.current?.(data.users);
        });

        // Cleanup on unmount
        return () => {
            if (socket.connected) {
                socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
            }
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomId, userId, userName, userRole]);

    // Send text message - returns message ID for tracking
    const sendMessage = useCallback(
        (content: string, type: 'text' | 'file' | 'milestone' = 'text', attachmentUrl?: string, attachmentName?: string): string | null => {
            if (!socketRef.current?.connected) {
                console.warn('[Socket] Cannot send message - not connected');
                return null;
            }
            if (type === 'text' && !content.trim()) return null;

            const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const payload: SendMessagePayload & { messageId: string } = {
                messageId,
                roomId,
                senderId: userId,
                senderName: userName,
                senderRole: userRole,
                content,
                type,
                attachmentUrl,
                attachmentName,
            };

            socketRef.current.emit(SOCKET_EVENTS.SEND_MESSAGE, payload);
            console.log('[Socket] Message sent:', messageId);

            // Stop typing indicator when message is sent
            stopTyping();

            return messageId;
        },
        [roomId, userId, userName, userRole]
    );

    // Send file message
    const sendFileMessage = useCallback(
        (attachmentUrl: string, attachmentName: string): string | null => {
            if (!socketRef.current?.connected) {
                console.warn('[Socket] Cannot send file - not connected');
                return null;
            }

            const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const payload: SendMessagePayload & { messageId: string } = {
                messageId,
                roomId,
                senderId: userId,
                senderName: userName,
                senderRole: userRole,
                content: '',
                type: 'file',
                attachmentUrl,
                attachmentName,
            };

            socketRef.current.emit(SOCKET_EVENTS.SEND_MESSAGE, payload);
            console.log('[Socket] File message sent:', messageId);

            return messageId;
        },
        [roomId, userId, userName, userRole]
    );

    // Typing indicators
    const startTyping = useCallback(() => {
        if (!socketRef.current?.connected) return;

        socketRef.current.emit(SOCKET_EVENTS.TYPING_START, {
            roomId,
            userId,
            userName,
        } as TypingPayload);

        // Auto-stop typing after 3 seconds of no input
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 3000);
    }, [roomId, userId, userName]);

    const stopTyping = useCallback(() => {
        if (!socketRef.current?.connected) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        socketRef.current.emit(SOCKET_EVENTS.TYPING_STOP, {
            roomId,
            userId,
            userName,
        } as TypingPayload);
    }, [roomId, userId, userName]);

    return {
        isConnected,
        sendMessage,
        sendFileMessage,
        startTyping,
        stopTyping,
        onlineUsers,
    };
}
