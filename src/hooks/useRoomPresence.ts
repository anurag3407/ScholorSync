'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type RoomsPresencePayload } from '@/lib/socket/socketEvents';
import type { UserRole } from '@/types/fellowships';

interface RoomPresenceInfo {
    userCount: number;
    users: Array<{
        id: string;
        name: string;
        role: UserRole;
    }>;
}

interface UseRoomPresenceOptions {
    roomIds: string[];
    pollInterval?: number; // ms, default 30s
}

interface UseRoomPresenceReturn {
    isConnected: boolean;
    presence: Record<string, RoomPresenceInfo>;
    refreshPresence: () => void;
}

/**
 * Lightweight hook for tracking presence across multiple rooms.
 * Used by rooms list page to show which rooms have active users.
 */
export function useRoomPresence({
    roomIds,
    pollInterval = 30000,
}: UseRoomPresenceOptions): UseRoomPresenceReturn {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [presence, setPresence] = useState<Record<string, RoomPresenceInfo>>({});

    // Request presence update
    const refreshPresence = useCallback(() => {
        if (socketRef.current?.connected && roomIds.length > 0) {
            socketRef.current.emit(SOCKET_EVENTS.GET_ROOMS_PRESENCE, { roomIds });
        }
    }, [roomIds]);

    useEffect(() => {
        if (roomIds.length === 0) return;

        // Create socket connection - use external socket server URL if configured
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[RoomPresence] Connected');
            setIsConnected(true);
            // Request initial presence
            socket.emit(SOCKET_EVENTS.GET_ROOMS_PRESENCE, { roomIds });
        });

        socket.on('disconnect', () => {
            console.log('[RoomPresence] Disconnected');
            setIsConnected(false);
        });

        // Listen for presence updates
        socket.on(SOCKET_EVENTS.ROOMS_PRESENCE, (data: RoomsPresencePayload) => {
            setPresence(data.rooms);
        });

        // Poll for updates periodically
        const intervalId = setInterval(() => {
            if (socket.connected) {
                socket.emit(SOCKET_EVENTS.GET_ROOMS_PRESENCE, { roomIds });
            }
        }, pollInterval);

        return () => {
            clearInterval(intervalId);
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomIds, pollInterval]);

    // Refresh when roomIds change
    useEffect(() => {
        refreshPresence();
    }, [refreshPresence]);

    return {
        isConnected,
        presence,
        refreshPresence,
    };
}
