import { NextRequest, NextResponse } from 'next/server';
import {
    getChallenges,
    createChallenge,
    updateChallenge,
    getChallenge,
    updateChallengeStatus,
    getProposalsByChallenge
} from '@/lib/firebase/fellowships';

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdmin(request: NextRequest): boolean {
    const email = request.headers.get('x-admin-email');
    const password = request.headers.get('x-admin-password');
    return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

// GET - List all challenges
export async function GET(request: NextRequest) {
    try {
        if (!verifyAdmin(request)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as any;
        const category = searchParams.get('category') as any;
        const challengeId = searchParams.get('id');

        // Get single challenge with proposals
        if (challengeId) {
            const challenge = await getChallenge(challengeId);
            if (!challenge) {
                return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
            }
            const proposals = await getProposalsByChallenge(challengeId);
            return NextResponse.json({
                success: true,
                data: { ...challenge, proposals }
            });
        }

        // Get all challenges with filters
        const filters: any = {};
        if (status) filters.status = status;
        if (category) filters.category = category;

        const challenges = await getChallenges(filters, 100);
        return NextResponse.json({ success: true, data: challenges });
    } catch (error) {
        console.error('Error fetching challenges:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch challenges' }, { status: 500 });
    }
}

// POST - Create new challenge
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminEmail, adminPassword, ...challengeData } = body;

        if (adminEmail !== ADMIN_EMAIL || adminPassword !== ADMIN_PASSWORD) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const challengeId = await createChallenge({
            ...challengeData,
            corporateId: 'admin',
            corporateName: 'ScholarSync Admin',
            companyName: challengeData.companyName || 'ScholarSync',
        });

        return NextResponse.json({ success: true, data: { id: challengeId } });
    } catch (error) {
        console.error('Error creating challenge:', error);
        return NextResponse.json({ success: false, error: 'Failed to create challenge' }, { status: 500 });
    }
}

// PUT - Update challenge
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminEmail, adminPassword, challengeId, status, ...updateData } = body;

        if (adminEmail !== ADMIN_EMAIL || adminPassword !== ADMIN_PASSWORD) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (!challengeId) {
            return NextResponse.json({ success: false, error: 'Challenge ID required' }, { status: 400 });
        }

        // Update status if provided
        if (status) {
            await updateChallengeStatus(challengeId, status);
        }

        // Update other fields
        if (Object.keys(updateData).length > 0) {
            await updateChallenge(challengeId, updateData);
        }

        return NextResponse.json({ success: true, message: 'Challenge updated' });
    } catch (error) {
        console.error('Error updating challenge:', error);
        return NextResponse.json({ success: false, error: 'Failed to update challenge' }, { status: 500 });
    }
}

// DELETE - Delete challenge (mark as cancelled)
export async function DELETE(request: NextRequest) {
    try {
        if (!verifyAdmin(request)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const challengeId = searchParams.get('id');

        if (!challengeId) {
            return NextResponse.json({ success: false, error: 'Challenge ID required' }, { status: 400 });
        }

        // Mark as cancelled instead of hard delete
        await updateChallengeStatus(challengeId, 'cancelled');

        return NextResponse.json({ success: true, message: 'Challenge cancelled' });
    } catch (error) {
        console.error('Error deleting challenge:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete challenge' }, { status: 500 });
    }
}
