'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, ArrowRight, Clock, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getProposalsByStudent, getChallenge } from '@/lib/firebase/fellowships';
import type { Proposal, Challenge } from '@/types/fellowships';

interface ProposalWithChallenge extends Proposal {
    challenge?: Challenge;
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    payment_pending: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    selected: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export default function MyProposalsPage() {
    const { user } = useAuth();
    const [proposals, setProposals] = useState<ProposalWithChallenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            loadProposals();
        }
    }, [user?.uid]);

    const loadProposals = async () => {
        try {
            setLoading(true);
            const data = await getProposalsByStudent(user!.uid);

            // Fetch challenge details for each proposal
            const proposalsWithChallenges = await Promise.all(
                data.map(async (proposal) => {
                    const challenge = await getChallenge(proposal.challengeId);
                    return { ...proposal, challenge: challenge || undefined };
                })
            );

            setProposals(proposalsWithChallenges);
        } catch (error) {
            console.error('Error loading proposals:', error);
            // Demo data
            setProposals(getMockProposals());
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">My Proposals</h1>
                <p className="text-muted-foreground">
                    Track the status of your applications
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{proposals.length}</div>
                        <p className="text-sm text-muted-foreground">Total Applied</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {proposals.filter(p => p.status === 'selected').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Selected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-amber-600">
                            {proposals.filter(p => p.status === 'pending').length}
                        </div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                    </CardContent>
                </Card>
            </div>

            {/* Proposals List */}
            {proposals.length > 0 ? (
                <div className="space-y-4">
                    {proposals.map((proposal) => (
                        <Card key={proposal.id} className="transition-all hover:shadow-md">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">
                                            {proposal.challengeTitle || proposal.challenge?.title || 'Challenge'}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {proposal.challenge?.companyName}
                                        </p>
                                    </div>
                                    <Badge className={cn("ml-2", STATUS_STYLES[proposal.status])}>
                                        {proposal.status === 'pending' && 'Under Review'}
                                        {proposal.status === 'selected' && '✓ Selected'}
                                        {proposal.status === 'rejected' && 'Not Selected'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                    {proposal.coverLetter}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {format(new Date(proposal.createdAt), 'MMM d, yyyy')}
                                        </span>
                                        {proposal.challenge && (
                                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                                <IndianRupee className="h-4 w-4" />
                                                {proposal.challenge.price.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/fellowships/challenges/${proposal.challengeId}`}>
                                            <Button variant="outline" size="sm">
                                                View Challenge
                                            </Button>
                                        </Link>
                                        {proposal.status === 'selected' && (
                                            <Link href={`/fellowships/rooms`}>
                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                                    Go to Project Room
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
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
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No proposals yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Start applying to challenges to see them here
                        </p>
                        <Link href="/fellowships/challenges">
                            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                                Browse Challenges
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function getMockProposals(): ProposalWithChallenge[] {
    return [
        {
            id: 'prop-1',
            challengeId: 'demo-1',
            challengeTitle: 'Design a Modern Logo for TechStart',
            studentId: 'student-1',
            studentName: 'Student',
            coverLetter: 'I am excited to apply for this challenge. With my experience in brand design and proficiency in Figma...',
            status: 'selected',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            challenge: {
                id: 'demo-1',
                title: 'Design a Modern Logo for TechStart',
                description: 'Looking for a modern logo...',
                price: 5000,
                status: 'in_progress',
                corporateId: 'corp-1',
                corporateName: 'Raj Kumar',
                companyName: 'TechStart India',
                category: 'design',
                deadline: new Date(),
                requirements: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        },
        {
            id: 'prop-2',
            challengeId: 'demo-2',
            challengeTitle: 'Write SEO Blog Posts for EdTech Platform',
            studentId: 'student-1',
            studentName: 'Student',
            coverLetter: 'As a content writer with experience in EdTech, I believe I can deliver high-quality SEO articles...',
            status: 'pending',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            challenge: {
                id: 'demo-2',
                title: 'Write SEO Blog Posts for EdTech Platform',
                description: 'Need blog posts...',
                price: 8000,
                status: 'open',
                corporateId: 'corp-2',
                corporateName: 'Priya Sharma',
                companyName: 'LearnHub',
                category: 'content',
                deadline: new Date(),
                requirements: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        },
    ];
}
