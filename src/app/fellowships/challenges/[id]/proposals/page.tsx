'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Loader2,
    CheckCircle,
    Users,
    Mail,
    Clock,
    IndianRupee,
    Award,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    getChallenge,
    getProposalsByChallenge,
    initiateProposalSelection,
    revertProposalSelection,
} from '@/lib/firebase/fellowships';
import type { Challenge, Proposal } from '@/types/fellowships';
import { CHALLENGE_CATEGORIES } from '@/types/fellowships';
import { toast } from 'sonner';

const PROPOSAL_STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    payment_pending: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    selected: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

// Load Razorpay script dynamically
const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function ProposalsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selecting, setSelecting] = useState(false);
    const [success, setSuccess] = useState(false);

    const challengeId = params.id as string;

    useEffect(() => {
        if (challengeId) {
            loadData();
        }
    }, [challengeId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [challengeData, proposalsData] = await Promise.all([
                getChallenge(challengeId),
                getProposalsByChallenge(challengeId),
            ]);

            if (challengeData) {
                setChallenge(challengeData);
                setProposals(proposalsData);
            } else {
                // Demo data
                setChallenge(getMockChallenge(challengeId));
                setProposals(getMockProposals(challengeId));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setChallenge(getMockChallenge(challengeId));
            setProposals(getMockProposals(challengeId));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProposal = async () => {
        if (!selectedProposal || !challenge) return;

        setSelecting(true);
        try {
            // 1️⃣ Load Razorpay script
            const loaded = await loadRazorpay();
            if (!loaded) {
                toast.error('Payment gateway failed to load. Please try again.');
                setSelecting(false);
                return;
            }

            // 2️⃣ Mark proposal as payment pending
            await initiateProposalSelection(selectedProposal.id);

            // 3️⃣ Create Razorpay order for escrow
            const orderRes = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'escrow',
                    amount: challenge.price,
                    challengeId,
                    proposalId: selectedProposal.id,
                }),
            });
            const orderData = await orderRes.json();

            if (!orderData.success) {
                await revertProposalSelection(selectedProposal.id);
                throw new Error('Failed to create payment order');
            }

            setShowConfirmModal(false);

            await new Promise(resolve => setTimeout(resolve, 100));

            // 5️⃣ Open Razorpay checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.orderId,
                name: 'Fellowship Escrow',
                description: `Award fellowship for: ${challenge.title}`,
                handler: async function (response: any) {
                    try {
                        // 5️⃣ Confirm escrow payment and create room
                        const confirmRes = await fetch('/api/payments/escrow-confirm', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...response,
                                challengeId,
                                proposalId: selectedProposal.id,
                            }),
                        });
                        const confirmData = await confirmRes.json();

                        if (confirmData.success && confirmData.roomId) {
                            setSuccess(true);
                            toast.success('Fellowship awarded successfully! 🎉');
                            setTimeout(() => {
                                router.push(`/fellowships/room/${confirmData.roomId}`);
                            }, 2000);
                        } else {
                            throw new Error(confirmData.error || 'Confirmation failed');
                        }
                    } catch (err) {
                        console.error('Escrow confirm error:', err);
                        toast.error('Payment confirmed but room creation failed.');
                    }
                },
                modal: {
                    ondismiss: async function () {
                        // Revert if user closes payment modal
                        await revertProposalSelection(selectedProposal.id);
                        toast.info('Payment cancelled. Proposal status restored.');
                        setSelecting(false);
                        setShowConfirmModal(false);
                    },
                },
                prefill: {
                    email: user?.email || '',
                },
                theme: {
                    color: '#10B981', // emerald-600
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Error selecting proposal:', error);
            toast.error('Failed to initiate payment. Please try again.');
            // Revert proposal status
            if (selectedProposal) {
                await revertProposalSelection(selectedProposal.id);
            }
        } finally {
            setSelecting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-xl font-semibold">Challenge not found</h2>
                <Button variant="link" onClick={() => router.push('/fellowships/my-challenges')}>
                    Back to my challenges
                </Button>
            </div>
        );
    }

    const category = CHALLENGE_CATEGORIES[challenge.category];
    const pendingProposals = proposals.filter(p => p.status === 'pending');
    const hasSelectedProposal = proposals.some(p => p.status === 'selected');

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            {/* Challenge Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <Badge variant="secondary" className={cn("text-sm", category.color)}>
                                {category.icon} {category.label}
                            </Badge>
                            <CardTitle className="mt-2 text-xl">{challenge.title}</CardTitle>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600">
                                ₹{challenge.price.toLocaleString('en-IN')}
                            </p>
                            <p className="text-sm text-muted-foreground">Fellowship Amount</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Users className="mx-auto h-5 w-5 text-muted-foreground" />
                        <p className="mt-2 text-2xl font-bold">{proposals.length}</p>
                        <p className="text-sm text-muted-foreground">Total Proposals</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Clock className="mx-auto h-5 w-5 text-amber-500" />
                        <p className="mt-2 text-2xl font-bold">{pendingProposals.length}</p>
                        <p className="text-sm text-muted-foreground">Pending Review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Award className="mx-auto h-5 w-5 text-emerald-500" />
                        <p className="mt-2 text-2xl font-bold">{hasSelectedProposal ? '1' : '0'}</p>
                        <p className="text-sm text-muted-foreground">Selected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Proposals List */}
            <div>
                <h2 className="text-lg font-semibold mb-4">All Proposals</h2>

                {proposals.length > 0 ? (
                    <div className="space-y-4">
                        {proposals.map((proposal) => (
                            <Card
                                key={proposal.id}
                                className={cn(
                                    "transition-all",
                                    proposal.status === 'pending' && "hover:border-emerald-300 dark:hover:border-emerald-700",
                                    proposal.status === 'selected' && "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20"
                                )}
                            >
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                {proposal.studentName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold">{proposal.studentName}</h3>
                                                    {proposal.studentEmail && (
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {proposal.studentEmail}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={PROPOSAL_STATUS_STYLES[proposal.status]}>
                                                        {proposal.status === 'pending' && 'Under Review'}
                                                        {proposal.status === 'payment_pending' && '💳 Payment Processing'}
                                                        {proposal.status === 'selected' && '✓ Selected'}
                                                        {proposal.status === 'rejected' && 'Not Selected'}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {format(new Date(proposal.createdAt), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-3 rounded-lg bg-muted/50 p-4">
                                                <p className="text-sm font-medium mb-2">Proposal:</p>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {proposal.coverLetter}
                                                </p>
                                            </div>

                                            {proposal.status === 'pending' && !hasSelectedProposal && (
                                                <div className="mt-4 flex justify-end">
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedProposal(proposal);
                                                            setShowConfirmModal(true);
                                                        }}
                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                    >
                                                        <Award className="mr-2 h-4 w-4" />
                                                        Select & Award Fellowship
                                                    </Button>
                                                </div>
                                            )}

                                            {proposal.status === 'selected' && (
                                                <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                                                    <CheckCircle className="h-5 w-5" />
                                                    <span className="font-medium">Fellowship awarded! Project room created.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No proposals yet</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Students haven't applied to this challenge yet
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Selection Confirmation Modal */}
            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent>
                    {success ? (
                        <div className="flex flex-col items-center py-8">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">Fellowship Awarded!</h3>
                            <p className="mt-2 text-center text-muted-foreground">
                                Project room created. Redirecting...
                            </p>
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-emerald-600" />
                                    Award Fellowship
                                </DialogTitle>
                                <DialogDescription>
                                    You are about to select {selectedProposal?.studentName} for this fellowship.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Fellowship Amount</span>
                                        <span className="text-lg font-bold text-emerald-600 flex items-center">
                                            <IndianRupee className="h-4 w-4" />
                                            {challenge.price.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-5 w-5 mt-0.5" />
                                        <div>
                                            <p className="font-medium">This action will:</p>
                                            <ul className="mt-2 space-y-1 text-sm">
                                                <li>• Create a private project room for collaboration</li>
                                                <li>• Hold ₹{challenge.price.toLocaleString('en-IN')} in escrow</li>
                                                <li>• Reject all other pending proposals</li>
                                                <li>• Notify the selected student</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSelectProposal}
                                    disabled={selecting}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {selecting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Confirm & Create Room
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getMockChallenge(id: string): Challenge {
    return {
        id,
        title: 'Design a Modern Logo for TechStart',
        description: 'Looking for a modern logo...',
        price: 5000,
        status: 'open',
        corporateId: 'user-1',
        corporateName: 'Your Company',
        companyName: 'TechStart India',
        category: 'design',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requirements: [],
        proposalCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

function getMockProposals(challengeId: string): Proposal[] {
    return [
        {
            id: 'prop-1',
            challengeId,
            studentId: 'student-1',
            studentName: 'Priya Sharma',
            studentEmail: 'priya.sharma@college.ac.in',
            coverLetter: `I'm a final year design student at NID Ahmedabad with 2 years of freelance experience in brand identity design.

For TechStart, I envision a minimalist logo that combines a subtle "T" lettermark with an upward arrow, symbolizing growth and innovation. I can deliver:
- 5 initial concepts within 3 days
- Unlimited revisions on the selected concept
- Full brand kit including color palette and typography guidelines

Portfolio: behance.net/priyasharma`,
            status: 'pending',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
            id: 'prop-2',
            challengeId,
            studentId: 'student-2',
            studentName: 'Rahul Verma',
            studentEmail: 'rahul.v@iitd.ac.in',
            coverLetter: `As a self-taught designer currently pursuing B.Tech at IIT Delhi, I bring a unique blend of technical thinking and creative design.

My approach: I'll start with competitor analysis, create 3 distinct mood boards, and develop concepts that balance modernity with trust.

Check my recent work: dribbble.com/rahulverma`,
            status: 'pending',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
            id: 'prop-3',
            challengeId,
            studentId: 'student-3',
            studentName: 'Ananya Gupta',
            studentEmail: 'ananya@srcc.du.ac.in',
            coverLetter: `I'm passionate about branding and have worked on 10+ logo projects for startups during my internship at a design agency.

I specialize in versatile logos that work across all platforms - from app icons to billboards.`,
            status: 'pending',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
    ];
}
