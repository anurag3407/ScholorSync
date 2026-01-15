import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
    getChallenge,
    getProposal,
    confirmProposalSelection,
    revertProposalSelection,
} from '@/lib/firebase/fellowships';

export async function POST(req: NextRequest) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            challengeId,
            proposalId,
        } = await req.json();

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { error: 'Missing payment details' },
                { status: 400 }
            );
        }

        if (!challengeId || !proposalId) {
            return NextResponse.json(
                { error: 'Missing challenge or proposal ID' },
                { status: 400 }
            );
        }

        // Verify Razorpay signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            // Revert proposal status on signature failure
            await revertProposalSelection(proposalId);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        // Get challenge and proposal data
        const [challenge, proposal] = await Promise.all([
            getChallenge(challengeId),
            getProposal(proposalId),
        ]);

        if (!challenge || !proposal) {
            await revertProposalSelection(proposalId);
            return NextResponse.json(
                { error: 'Challenge or proposal not found' },
                { status: 404 }
            );
        }

        // ✅ Payment verified → Create room with escrow held
        const roomId = await confirmProposalSelection(
            challengeId,
            proposalId,
            challenge,
            proposal,
            razorpay_payment_id
        );

        return NextResponse.json({
            success: true,
            roomId,
            message: 'Escrow confirmed. Project room created.',
        });
    } catch (err) {
        console.error('Escrow confirm error:', err);
        return NextResponse.json(
            { error: 'Escrow confirmation failed' },
            { status: 500 }
        );
    }
}
