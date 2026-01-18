import type { RoomMessage, UserRole } from '@/types/fellowships';

export const SOCKET_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',

    JOIN_ROOM: 'join-room',
    LEAVE_ROOM: 'leave-room',

    SEND_MESSAGE: 'send-message',
    NEW_MESSAGE: 'new-message',

    TYPING_START: 'typing-start',
    TYPING_STOP: 'typing-stop',
    USER_TYPING: 'user-typing',

    FILE_UPLOADED: 'file-uploaded',

    USER_JOINED: 'user-joined',
    USER_LEFT: 'user-left',
    ROOM_USERS: 'room-users',

    // Global presence events
    GET_ROOMS_PRESENCE: 'get-rooms-presence',
    ROOMS_PRESENCE: 'rooms-presence',
} as const;


export interface JoinRoomPayload {
    roomId: string;
    userId: string;
    userName: string;
    userRole: UserRole;
}

export interface SendMessagePayload {
    roomId: string;
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    content: string;
    type: 'text' | 'file' | 'milestone';
    attachmentUrl?: string;
    attachmentName?: string;
}

export interface TypingPayload {
    roomId: string;
    userId: string;
    userName: string;
}

export interface FileUploadedPayload {
    roomId: string;
    message: RoomMessage;
}

export interface RoomUserPayload {
    roomId: string;
    userId: string;
    userName: string;
    userRole: UserRole;
}

export interface RoomUsersPayload {
    roomId: string;
    users: Array<{
        id: string;
        name: string;
        role: UserRole;
    }>;
}

export interface RoomsPresencePayload {
    rooms: Record<string, {
        userCount: number;
        users: Array<{
            id: string;
            name: string;
            role: UserRole;
        }>;
    }>;
}

