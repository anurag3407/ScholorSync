import { NextRequest, NextResponse } from 'next/server';
import razorpay from '@/lib/razorpay/client';

export async function POST(req: NextRequest) {
    try {
        const { roomId, amount } = await req.json();

        if (!roomId || !amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid data' },
                { status: 400 }
            );
        }

        const order = await razorpay.orders.create({
            amount: amount * 100, // paise
            currency: 'INR',
            receipt: `room_${roomId}`,
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (err) {
        console.error('Create order error:', err);
        return NextResponse.json(
            { success: false, error: 'Order creation failed' },
            { status: 500 }
        );
    }
}
