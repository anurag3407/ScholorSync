import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

interface Broadcast {
    id: string;
    title: string;
    description?: string;
    variant: 'info' | 'warning' | 'success' | 'teal';
    link?: string;
    linkText?: string;
    isActive: boolean;
    createdAt: Timestamp | Date;
    createdBy: string;
}

// GET - Fetch active broadcast (latest first)
export async function GET() {
    try {
        // Simple query - fetch all broadcasts, filter and sort in JS to avoid composite index
        const snapshot = await getDocs(collection(db, 'broadcasts'));

        const broadcasts: Broadcast[] = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Broadcast[];

        // Filter active and sort by createdAt (newest first)
        const activeBroadcasts = broadcasts
            .filter(b => b.isActive)
            .sort((a, b) => {
                const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
                const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
                return bTime - aTime; // Descending (newest first)
            });

        // Return only the most recent active broadcast
        const activeBroadcast = activeBroadcasts.length > 0 ? activeBroadcasts[0] : null;

        return NextResponse.json({ success: true, broadcast: activeBroadcast });

    } catch (error) {
        console.error('Broadcast GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch broadcast' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, variant, link, linkText, adminId } = body;

        if (!adminId) {
            return NextResponse.json(
                { error: 'Admin authentication required' },
                { status: 401 }
            );
        }

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const newBroadcast = {
            title,
            description: description || '',
            variant: variant || 'info',
            link: link || '',
            linkText: linkText || 'Learn More',
            isActive: true,
            createdAt: serverTimestamp(),
            createdBy: adminId,
        };

        const docRef = await addDoc(collection(db, 'broadcasts'), newBroadcast);

        return NextResponse.json({
            success: true,
            broadcastId: docRef.id,
            message: 'Broadcast created successfully',
        });

    } catch (error) {
        console.error('Broadcast POST error:', error);
        return NextResponse.json(
            { error: 'Failed to create broadcast' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Broadcast ID required' },
                { status: 400 }
            );
        }

        await deleteDoc(doc(db, 'broadcasts', id));

        return NextResponse.json({
            success: true,
            message: 'Broadcast deleted successfully',
        });

    } catch (error) {
        console.error('Broadcast DELETE error:', error);
        return NextResponse.json(
            { error: 'Failed to delete broadcast' },
            { status: 500 }
        );
    }
}
