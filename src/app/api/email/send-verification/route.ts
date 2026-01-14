import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '@/lib/email/nodemailer';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, userId, role } = body;

        if (!email || !userId || !role) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: email, userId, role' },
                { status: 400 }
            );
        }

        if (!isFirebaseConfigured || !db) {
            return NextResponse.json(
                { success: false, message: 'Firebase is not configured' },
                { status: 500 }
            );
        }

        const verificationToken = uuidv4();

        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24);

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            verificationToken,
            verificationTokenExpiry: Timestamp.fromDate(tokenExpiry),
            pendingVerificationRole: role,
        });

        const result = await sendVerificationEmail({
            email,
            userId,
            role,
            verificationToken,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.',
        });
    } catch (error) {
        console.error('Error in send-verification API:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
