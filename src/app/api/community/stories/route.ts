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

interface SuccessStory {
    id: string;
    authorId: string;
    authorName: string;
    avatar: string;
    scholarship: string;
    amount: string;
    tips: string;
    createdAt: Timestamp | Date;
}

export async function GET() {
    try {
        const q = query(
            collection(db, 'successStories'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const stories: SuccessStory[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as SuccessStory[];

        return NextResponse.json({ success: true, stories });

    } catch (error) {
        console.error('Success Stories GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stories' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, userName, userAvatar, scholarship, amount, tips } = body;

        if (!userId || !userName) {
            return NextResponse.json(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        if (!scholarship || !amount || !tips) {
            return NextResponse.json(
                { error: 'Scholarship name, amount, and tips are required' },
                { status: 400 }
            );
        }

        const newStory = {
            authorId: userId,
            authorName: userName,
            avatar: userAvatar || userName.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            scholarship,
            amount,
            tips,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'successStories'), newStory);

        return NextResponse.json({
            success: true,
            storyId: docRef.id,
            message: 'Story shared successfully',
        });

    } catch (error) {
        console.error('Success Stories POST error:', error);
        return NextResponse.json(
            { error: 'Failed to create story' },
            { status: 500 }
        );
    }
}
