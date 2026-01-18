import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import {
    collection,
    getDocs,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

interface Discussion {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    avatar: string;
    category: string;
    tags: string[];
    createdAt: Timestamp | Date;
}

export async function GET() {
    try {
        const q = query(
            collection(db, 'discussions'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const discussions: Discussion[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Discussion[];

        return NextResponse.json({ success: true, discussions });

    } catch (error) {
        console.error('Discussions GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch discussions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, userName, userAvatar, title, content, category, tags } = body;

        if (!userId || !userName) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const newDiscussion = {
            title,
            content,
            authorId: userId,
            authorName: userName,
            avatar: userAvatar || userName.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            category: category || 'general',
            tags: tags || [],
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'discussions'), newDiscussion);

        return NextResponse.json({
            success: true,
            discussionId: docRef.id,
            message: 'Discussion started successfully',
        });

    } catch (error) {
        console.error('Discussions POST error:', error);
        return NextResponse.json(
            { error: 'Failed to create discussion' },
            { status: 500 }
        );
    }
}
