import { NextRequest, NextResponse } from 'next/server';
import { updateApplicationStatus } from '@/lib/firebase/firestore';

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, scholarshipId, status, notes } = body;

        if (!userId || !scholarshipId || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: userId, scholarshipId, status' },
                { status: 400 }
            );
        }

        const validStatuses = ['applied', 'pending', 'approved', 'rejected', 'document_review'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        await updateApplicationStatus(userId, scholarshipId, status, notes);

        return NextResponse.json({
            success: true,
            message: 'Application status updated successfully',
        });
    } catch (error) {
        console.error('Error updating application status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update application status' },
            { status: 500 }
        );
    }
}
