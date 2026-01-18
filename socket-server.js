// Standalone Socket.IO server for Render.com deployment
require('dotenv').config();

const { createServer } = require('http');
const { Server } = require('socket.io');

const port = parseInt(process.env.PORT || '3001', 10);

// Socket.IO event constants
const SOCKET_EVENTS = {
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
    GET_ROOMS_PRESENCE: 'get-rooms-presence',
    ROOMS_PRESENCE: 'rooms-presence',
};

// Track users in rooms
const roomUsers = new Map();

const httpServer = createServer((req, res) => {
    // Health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ScholorSync Socket.IO Server');
});

const io = new Server(httpServer, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000', 'https://*.vercel.app'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    let currentRoom = null;
    let currentUser = null;

    // Handle joining a room
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (payload) => {
        const { roomId, userId, userName, userRole } = payload;

        // Leave previous room if any
        if (currentRoom) {
            socket.leave(currentRoom);
            removeUserFromRoom(currentRoom, socket.id);
            socket.to(currentRoom).emit(SOCKET_EVENTS.USER_LEFT, {
                roomId: currentRoom,
                userId: currentUser?.id,
                userName: currentUser?.name,
                userRole: currentUser?.role,
            });
        }

        // Join new room
        currentRoom = roomId;
        currentUser = { id: userId, name: userName, role: userRole };
        socket.join(roomId);

        addUserToRoom(roomId, {
            id: userId,
            name: userName,
            role: userRole,
            socketId: socket.id
        });

        const users = getUsersInRoom(roomId);

        socket.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, {
            roomId,
            userId,
            userName,
            userRole,
        });

        socket.emit(SOCKET_EVENTS.ROOM_USERS, { roomId, users });
        socket.to(roomId).emit(SOCKET_EVENTS.ROOM_USERS, { roomId, users });

        console.log(`[Socket.IO] User ${userName} joined room ${roomId} (${users.length} users now)`);
    });

    // Handle leaving a room
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (payload) => {
        const { roomId } = payload;
        socket.leave(roomId);
        removeUserFromRoom(roomId, socket.id);

        if (currentUser) {
            socket.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, {
                roomId,
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: currentUser.role,
            });

            const users = getUsersInRoom(roomId);
            io.to(roomId).emit(SOCKET_EVENTS.ROOM_USERS, { roomId, users });
        }

        console.log(`[Socket.IO] User ${currentUser?.name || 'unknown'} left room ${roomId}`);
        currentRoom = null;
    });

    // Handle sending messages
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, (payload) => {
        const { roomId, messageId, ...messageData } = payload;

        const message = {
            id: messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            roomId,
            ...messageData,
            createdAt: new Date().toISOString(),
        };

        io.to(roomId).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
        console.log(`[Socket.IO] Message sent in room ${roomId}: ${message.id}`);
    });

    // Handle typing indicators
    socket.on(SOCKET_EVENTS.TYPING_START, (payload) => {
        const { roomId, userId, userName } = payload;
        socket.to(roomId).emit(SOCKET_EVENTS.USER_TYPING, {
            roomId,
            userId,
            userName,
            isTyping: true,
        });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, (payload) => {
        const { roomId, userId, userName } = payload;
        socket.to(roomId).emit(SOCKET_EVENTS.USER_TYPING, {
            roomId,
            userId,
            userName,
            isTyping: false,
        });
    });

    // Handle file upload notifications
    socket.on(SOCKET_EVENTS.FILE_UPLOADED, (payload) => {
        const { roomId, message } = payload;
        io.to(roomId).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
        console.log(`[Socket.IO] File uploaded in room ${roomId}`);
    });

    // Handle rooms presence query
    socket.on(SOCKET_EVENTS.GET_ROOMS_PRESENCE, (payload) => {
        const { roomIds } = payload;
        const presence = getAllRoomsPresence(roomIds);
        socket.emit(SOCKET_EVENTS.ROOMS_PRESENCE, { rooms: presence });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (currentRoom && currentUser) {
            removeUserFromRoom(currentRoom, socket.id);
            socket.to(currentRoom).emit(SOCKET_EVENTS.USER_LEFT, {
                roomId: currentRoom,
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: currentUser.role,
            });

            const users = getUsersInRoom(currentRoom);
            io.to(currentRoom).emit(SOCKET_EVENTS.ROOM_USERS, { roomId: currentRoom, users });
        }
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
});

// Helper functions
function addUserToRoom(roomId, user) {
    if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
    }
    roomUsers.get(roomId).set(user.socketId, user);
}

function removeUserFromRoom(roomId, socketId) {
    if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socketId);
        if (roomUsers.get(roomId).size === 0) {
            roomUsers.delete(roomId);
        }
    }
}

function getUsersInRoom(roomId) {
    if (!roomUsers.has(roomId)) {
        return [];
    }
    return Array.from(roomUsers.get(roomId).values()).map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
    }));
}

function getAllRoomsPresence(roomIds) {
    const presence = {};
    for (const roomId of roomIds) {
        const users = getUsersInRoom(roomId);
        if (users.length > 0) {
            presence[roomId] = {
                userCount: users.length,
                users: users,
            };
        }
    }
    return presence;
}

httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> Socket.IO server running on port ${port}`);
    console.log(`> Health check: http://localhost:${port}/health`);
});
