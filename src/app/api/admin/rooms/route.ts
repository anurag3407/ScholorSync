import { NextRequest, NextResponse } from 'next/server';
import {
    getProjectRoom,
    getProjectRoomsByUser,
    getRoomMessages,
    updateEscrowStatus,
    getProjectRoomByChallenge
} from '@/lib/firebase/fellowships';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdmin(request: NextRequest): boolean {
    const email = request.headers.get('x-admin-email');
    const password = request.headers.get('x-admin-password');
    return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

async function getAllProjectRooms(limitCount = 50) {
    if (!isFirebaseConfigured || !db) return [];

    const roomsRef = collection(db, 'projectRooms');
    const q = query(roomsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        completedAt: doc.data().completedAt?.toDate?.() || null,
    }));
}

export async function GET(request: NextRequest) {
    try {
        if (!verifyAdmin(request)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('id');
        const challengeId = searchParams.get('challengeId');
        const includeMessages = searchParams.get('messages') === 'true';

        if (roomId) {
            const room = await getProjectRoom(roomId);
            if (!room) {
                return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
            }

            let messages: any[] = [];
            if (includeMessages) {
                messages = await getRoomMessages(roomId, 200);
            }

            return NextResponse.json({
                success: true,
                data: { ...room, messages }
            });
        }

        if (challengeId) {
            const room = await getProjectRoomByChallenge(challengeId);
            if (!room) {
                return NextResponse.json({ success: false, error: 'No room found for this challenge' }, { status: 404 });
            }

            let messages: any[] = [];
            if (includeMessages) {
                messages = await getRoomMessages(room.id, 200);
            }

            return NextResponse.json({
                success: true,
                data: { ...room, messages }
            });
        }

        const rooms = await getAllProjectRooms(100);
        return NextResponse.json({ success: true, data: rooms });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch rooms' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminEmail, adminPassword, roomId, escrowStatus, action } = body;

        if (adminEmail !== ADMIN_EMAIL || adminPassword !== ADMIN_PASSWORD) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (!roomId) {
            return NextResponse.json({ success: false, error: 'Room ID required' }, { status: 400 });
        }


        if (escrowStatus) {
            await updateEscrowStatus(roomId, escrowStatus);
            return NextResponse.json({ success: true, message: `Escrow status updated to ${escrowStatus}` });
        }

        if (action === 'release') {
            await updateEscrowStatus(roomId, 'released');
            return NextResponse.json({ success: true, message: 'Escrow released to student' });
        }

        if (action === 'refund') {
            await updateEscrowStatus(roomId, 'disputed');
            return NextResponse.json({ success: true, message: 'Marked as disputed for refund review' });
        }

        return NextResponse.json({ success: false, error: 'No action specified' }, { status: 400 });
    } catch (error) {
        console.error('Error updating room:', error);
        return NextResponse.json({ success: false, error: 'Failed to update room' }, { status: 500 });
    }
}
