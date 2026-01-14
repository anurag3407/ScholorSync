import { NextRequest, NextResponse } from 'next/server';
import {
    getProposal,
    getProposalsByChallenge,
    getProposalsByStudent,
    updateProposalStatus
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

async function getAllProposals(limitCount = 100) {
    if (!isFirebaseConfigured || !db) return [];

    const proposalsRef = collection(db, 'proposals');
    const q = query(proposalsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));
}

export async function GET(request: NextRequest) {
    try {
        if (!verifyAdmin(request)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const proposalId = searchParams.get('id');
        const challengeId = searchParams.get('challengeId');
        const studentId = searchParams.get('studentId');

        if (proposalId) {
            const proposal = await getProposal(proposalId);
            if (!proposal) {
                return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: proposal });
        }

        if (challengeId) {
            const proposals = await getProposalsByChallenge(challengeId);
            return NextResponse.json({ success: true, data: proposals });
        }

        if (studentId) {
            const proposals = await getProposalsByStudent(studentId);
            return NextResponse.json({ success: true, data: proposals });
        }

        const proposals = await getAllProposals(100);
        return NextResponse.json({ success: true, data: proposals });
    } catch (error) {
        console.error('Error fetching proposals:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch proposals' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminEmail, adminPassword, proposalId, status } = body;

        if (adminEmail !== ADMIN_EMAIL || adminPassword !== ADMIN_PASSWORD) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (!proposalId || !status) {
            return NextResponse.json({ success: false, error: 'Proposal ID and status required' }, { status: 400 });
        }

        await updateProposalStatus(proposalId, status);
        return NextResponse.json({ success: true, message: `Proposal status updated to ${status}` });
    } catch (error) {
        console.error('Error updating proposal:', error);
        return NextResponse.json({ success: false, error: 'Failed to update proposal' }, { status: 500 });
    }
}
