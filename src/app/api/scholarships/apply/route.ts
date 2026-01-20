import { NextRequest, NextResponse } from 'next/server';
import { applyForScholarship } from '@/lib/firebase/firestore';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, scholarshipId, source } = body;

        if (!userId || !scholarshipId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: userId, scholarshipId' },
                { status: 400 }
            );
        }

        const validSources = ['scholarship_card', 'chatbot', 'direct'];
        const applicationSource = validSources.includes(source) ? source : 'direct';

        await applyForScholarship(userId, scholarshipId, applicationSource);

        return NextResponse.json({
            success: true,
            message: 'Application submitted successfully',
        });
    } catch (error: any) {
        console.error('Error applying for scholarship:', error);

        // Check if already applied
        if (error?.message?.includes('already applied')) {
            return NextResponse.json(
                { success: false, error: 'Already applied' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to submit application' },
            { status: 500 }
        );
    }
}
