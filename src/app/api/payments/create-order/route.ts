import { NextRequest, NextResponse } from 'next/server';
import { getRazorpay } from '@/lib/razorpay/client';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { amount, roomId, challengeId, proposalId, type } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        // Determine receipt based on order type
        // Note: Razorpay requires receipt length <= 40 chars
        let receipt: string;
        let notes: Record<string, string> = {};

        if (type === 'escrow' && challengeId && proposalId) {
            // Escrow order: Fellowship grant payment
            // Truncate IDs to fit within 40 chars: "esc_" (4) + cid (12) + "_" (1) + pid (12) = 29 chars max
            receipt = `esc_${challengeId.slice(0, 12)}_${proposalId.slice(0, 12)}`;
            notes = {
                type: 'escrow',
                challengeId,
                proposalId,
            };
        } else if (roomId) {
            // Release order: Fund release payment (existing flow)
            // Truncate roomId: "rel_" (4) + rid (20) = 24 chars max
            receipt = `rel_${roomId.slice(0, 20)}`;
            notes = {
                type: 'release',
                roomId,
            };
        } else {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create({
            amount: amount * 100, // paise
            currency: 'INR',
            receipt,
            notes,
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (err: any) {
        console.error('Create order error:', err?.message || err);
        return NextResponse.json(
            {
                success: false,
                error: err?.message || 'Order creation failed',
                details: process.env.NODE_ENV === 'development' ? String(err) : undefined
            },
            { status: 500 }
        );
    }
}
