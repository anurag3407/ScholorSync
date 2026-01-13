'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Building2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateUserFellowshipProfile } from '@/lib/firebase/fellowships';
import type { UserRole } from '@/types/fellowships';

interface RoleSelectorProps {
    onComplete?: () => void;
}

export function RoleSelector({ onComplete }: RoleSelectorProps) {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleContinue = async () => {
        if (!selectedRole || !user?.uid) return;

        setLoading(true);
        setError(null);

        try {
            console.log('[RoleSelector] Saving role:', selectedRole, 'for user:', user.uid);

            // Build profile data without undefined values (Firebase doesn't allow undefined)
            const profileData: { role: typeof selectedRole; companyName?: string } = {
                role: selectedRole,
            };
            if (selectedRole === 'corporate' && companyName.trim()) {
                profileData.companyName = companyName.trim();
            }

            await updateUserFellowshipProfile(user.uid, profileData);
            console.log('[RoleSelector] Role saved successfully');

            // Wait a moment for Firestore to propagate
            await new Promise(resolve => setTimeout(resolve, 500));

            await refreshUser();
            onComplete?.();
        } catch (err) {
            console.error('Error setting role:', err);
            setError('Failed to save your role. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <Sparkles className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="mt-4 text-2xl font-bold">Welcome to Fellowships</h1>
                <p className="mt-2 text-muted-foreground">
                    Choose how you'd like to participate in our micro-scholarship marketplace
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Student Option */}
                <Card
                    className={cn(
                        "cursor-pointer transition-all",
                        selectedRole === 'student'
                            ? "border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "hover:border-emerald-300 dark:hover:border-emerald-700"
                    )}
                    onClick={() => setSelectedRole('student')}
                >
                    <CardHeader className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                            <GraduationCap className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <CardTitle className="mt-4">I'm a Student</CardTitle>
                        <CardDescription>
                            Earn scholarships by solving real business challenges
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                Browse and apply to challenges
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                Build your portfolio
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-emerald-500">✓</span>
                                Earn money for education
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Corporate Option */}
                <Card
                    className={cn(
                        "cursor-pointer transition-all",
                        selectedRole === 'corporate'
                            ? "border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                            : "hover:border-blue-300 dark:hover:border-blue-700"
                    )}
                    onClick={() => setSelectedRole('corporate')}
                >
                    <CardHeader className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                            <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="mt-4">I'm a Company</CardTitle>
                        <CardDescription>
                            Post challenges and sponsor student fellowships
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                Post project challenges
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                Access verified student talent
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                CSR-eligible sponsorships
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Company Name Input */}
            {selectedRole === 'corporate' && (
                <Card>
                    <CardContent className="pt-6">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                            id="companyName"
                            placeholder="Enter your company name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>
            )}

            {/* Error Message */}
            {error && (
                <div className="rounded-lg bg-red-100 border border-red-300 p-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* Continue Button */}
            <Button
                onClick={handleContinue}
                disabled={!selectedRole || (selectedRole === 'corporate' && !companyName.trim()) || loading}
                className={cn(
                    "w-full",
                    selectedRole === 'corporate'
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                )}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                    </>
                ) : (
                    <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>
        </div>
    );
}
