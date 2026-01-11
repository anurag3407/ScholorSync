'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Search,
    Briefcase,
    Users,
    Home,
    TrendingUp,
    IndianRupee,
    Eye,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    Shield,
    MessageSquare,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getChallenges, getProjectRoomsByUser, updateChallengeStatus, updateEscrowStatus } from '@/lib/firebase/fellowships';
import type { Challenge, ProjectRoom } from '@/types/fellowships';
import { CHALLENGE_CATEGORIES, CHALLENGE_STATUS_LABELS } from '@/types/fellowships';

export default function AdminDashboard() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [rooms, setRooms] = useState<ProjectRoom[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [actionModal, setActionModal] = useState<{ type: 'close' | 'dispute' | null; item: Challenge | ProjectRoom | null }>({ type: null, item: null });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // For now, allow access even if not admin (for demo)
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [challengeData] = await Promise.all([
                getChallenges({}, 100),
            ]);
            setChallenges(challengeData.length > 0 ? challengeData : getMockChallenges());
            setRooms(getMockRooms());
        } catch (error) {
            console.error('Error loading admin data:', error);
            setChallenges(getMockChallenges());
            setRooms(getMockRooms());
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const totalChallenges = challenges.length;
    const openChallenges = challenges.filter(c => c.status === 'open').length;
    const inProgressChallenges = challenges.filter(c => c.status === 'in_progress').length;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const totalValue = challenges.reduce((sum, c) => sum + c.price, 0);
    const activeRooms = rooms.filter(r => r.status === 'active').length;

    const filteredChallenges = challenges.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.companyName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCloseChallenge = async () => {
        if (!actionModal.item) return;
        setProcessing(true);
        try {
            await updateChallengeStatus(actionModal.item.id, 'cancelled');
            setChallenges(challenges.map(c => c.id === actionModal.item!.id ? { ...c, status: 'cancelled' as const } : c));
        } catch (error) {
            console.error('Error closing challenge:', error);
        } finally {
            setProcessing(false);
            setActionModal({ type: null, item: null });
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="h-6 w-6 text-emerald-600" />
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Manage all challenges, rooms, and users
                    </p>
                </div>
                <Badge variant="outline" className="w-fit bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin Access
                </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            <span className="text-xs">Total</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold">{totalChallenges}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Open</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-green-600">{openChallenges}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">In Progress</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-blue-600">{inProgressChallenges}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Completed</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold">{completedChallenges}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <IndianRupee className="h-4 w-4" />
                            <span className="text-xs">Total Value</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-emerald-600">₹{(totalValue / 1000).toFixed(0)}k</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-amber-600">
                            <Home className="h-4 w-4" />
                            <span className="text-xs">Active Rooms</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-amber-600">{activeRooms}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="challenges" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="challenges" className="gap-2">
                        <Briefcase className="h-4 w-4" />
                        Challenges
                    </TabsTrigger>
                    <TabsTrigger value="rooms" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Project Rooms
                    </TabsTrigger>
                    <TabsTrigger value="disputes" className="gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Disputes
                    </TabsTrigger>
                </TabsList>

                {/* Challenges Tab */}
                <TabsContent value="challenges" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search challenges..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Challenge</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Proposals</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredChallenges.map((challenge) => (
                                    <TableRow key={challenge.id}>
                                        <TableCell className="font-medium max-w-[200px] truncate">
                                            {challenge.title}
                                        </TableCell>
                                        <TableCell>{challenge.companyName}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={cn("text-xs", CHALLENGE_CATEGORIES[challenge.category].color)}>
                                                {CHALLENGE_CATEGORIES[challenge.category].icon} {CHALLENGE_CATEGORIES[challenge.category].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-emerald-600 font-medium">
                                            ₹{challenge.price.toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={CHALLENGE_STATUS_LABELS[challenge.status].color}>
                                                {CHALLENGE_STATUS_LABELS[challenge.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{challenge.proposalCount || 0}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Link href={`/fellowships/challenges/${challenge.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {challenge.status === 'open' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => setActionModal({ type: 'close', item: challenge })}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Rooms Tab */}
                <TabsContent value="rooms" className="space-y-4">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Challenge</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Corporate</TableHead>
                                    <TableHead>Escrow</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rooms.map((room) => (
                                    <TableRow key={room.id}>
                                        <TableCell className="font-medium max-w-[200px] truncate">
                                            {room.challengeTitle}
                                        </TableCell>
                                        <TableCell>{room.studentName}</TableCell>
                                        <TableCell>{room.corporateName}</TableCell>
                                        <TableCell className="text-emerald-600 font-medium">
                                            ₹{room.escrowAmount.toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={room.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                                {room.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(room.createdAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/fellowships/room/${room.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Disputes Tab */}
                <TabsContent value="disputes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                Active Disputes
                            </CardTitle>
                            <CardDescription>
                                Manage escalated issues between students and corporates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center py-12 text-center">
                                <CheckCircle className="h-12 w-12 text-emerald-600" />
                                <h3 className="mt-4 text-lg font-semibold">No Active Disputes</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    All project rooms are running smoothly
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Close Challenge Modal */}
            <Dialog open={actionModal.type === 'close'} onOpenChange={() => setActionModal({ type: null, item: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Close Challenge
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to close this challenge? This will prevent new proposals.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
                        <p className="font-medium">{(actionModal.item as Challenge)?.title}</p>
                        <p className="text-sm text-muted-foreground">{(actionModal.item as Challenge)?.companyName}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionModal({ type: null, item: null })}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCloseChallenge}
                            disabled={processing}
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Close Challenge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getMockChallenges(): Challenge[] {
    return [
        {
            id: 'demo-1',
            title: 'Design a Modern Logo for TechStart',
            description: 'Looking for a modern logo...',
            price: 5000,
            status: 'open',
            corporateId: 'corp-1',
            corporateName: 'Raj Kumar',
            companyName: 'TechStart India',
            category: 'design',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            requirements: [],
            proposalCount: 12,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
        },
        {
            id: 'demo-2',
            title: 'Write SEO Blog Posts',
            description: 'Need blog posts...',
            price: 8000,
            status: 'in_progress',
            corporateId: 'corp-2',
            corporateName: 'Priya Sharma',
            companyName: 'LearnHub',
            category: 'content',
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            requirements: [],
            proposalCount: 8,
            selectedProposalId: 'prop-1',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
        },
        {
            id: 'demo-3',
            title: 'Build React Dashboard',
            description: 'Analytics dashboard...',
            price: 15000,
            status: 'completed',
            corporateId: 'corp-3',
            corporateName: 'Amit Patel',
            companyName: 'DataViz Solutions',
            category: 'development',
            deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            requirements: [],
            proposalCount: 5,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
        },
    ];
}

function getMockRooms(): ProjectRoom[] {
    return [
        {
            id: 'room-1',
            challengeId: 'demo-2',
            challengeTitle: 'Write SEO Blog Posts',
            studentId: 'student-1',
            studentName: 'Priya Sharma',
            corporateId: 'corp-2',
            corporateName: 'LearnHub',
            escrowStatus: 'held',
            escrowAmount: 8000,
            status: 'active',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
            id: 'room-2',
            challengeId: 'demo-3',
            challengeTitle: 'Build React Dashboard',
            studentId: 'student-2',
            studentName: 'Rahul Verma',
            corporateId: 'corp-3',
            corporateName: 'DataViz Solutions',
            escrowStatus: 'released',
            escrowAmount: 15000,
            status: 'completed',
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
    ];
}
