import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateEscrowStatus } from '@/lib/firebase/fellowships';

export async function POST(req: NextRequest) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            roomId,
        } = await req.json();

        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        // ✅ Payment confirmed → release scholarship
        await updateEscrowStatus(roomId, 'released');

        return NextResponse.json({
            success: true,
        });
    } catch (err) {
        console.error('Verify error:', err);
        return NextResponse.json(
            { error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}
