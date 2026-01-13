'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Building2, ArrowRight, Loader2, Sparkles, Mail, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateUserFellowshipProfile } from '@/lib/firebase/fellowships';
import { toast } from 'sonner';
import type { UserRole } from '@/types/fellowships';

interface RoleSelectorProps {
    onComplete?: () => void;
}

export function RoleSelector({ onComplete }: RoleSelectorProps) {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [verificationEmail, setVerificationEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [resending, setResending] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    const handleContinue = async () => {
        if (!selectedRole || !user?.uid || !verificationEmail.trim()) return;

        setLoading(true);
        setEmailError(null);
        try {
            const profileData: { role: UserRole; companyName?: string; institutionalEmail?: string } = {
                role: selectedRole,
                institutionalEmail: verificationEmail.trim(),
            };
            if (selectedRole === 'corporate' && companyName.trim()) {
                profileData.companyName = companyName.trim();
            }

            await updateUserFellowshipProfile(user.uid, profileData);

            toast.info('Sending verification email...', { duration: 2000 });

            const response = await fetch('/api/email/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: verificationEmail.trim(),
                    userId: user.uid,
                    role: selectedRole,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setEmailSent(true);
                toast.success('Verification email sent!', {
                    description: `Check your inbox at ${verificationEmail}`,
                    duration: 5000,
                });
            } else {
                setEmailError(result.message);
                toast.error('Failed to send verification email', {
                    description: result.message,
                });
            }
        } catch (error) {
            console.error('Error setting role:', error);
            setEmailError('An unexpected error occurred. Please try again.');
            toast.error('Something went wrong', {
                description: 'Please try again later',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        if (!selectedRole || !user?.uid || !verificationEmail.trim()) return;

        setResending(true);
        setEmailError(null);
        try {
            const response = await fetch('/api/email/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: verificationEmail.trim(),
                    userId: user.uid,
                    role: selectedRole,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Verification email resent!', {
                    description: `New email sent to ${verificationEmail}`,
                    duration: 5000,
                });
            } else {
                setEmailError(result.message);
                toast.error('Failed to resend email', {
                    description: result.message,
                });
            }
        } catch (error) {
            console.error('Error resending email:', error);
            toast.error('Failed to resend email');
        } finally {
            setResending(false);
        }
    };

    const handleCheckVerificationStatus = async () => {
        if (!user?.uid) return;

        setCheckingStatus(true);
        try {
            const response = await fetch(`/api/email/check-status?userId=${user.uid}`);
            const result = await response.json();

            if (result.isVerified) {
                toast.success('Email verified!', {
                    description: 'Your account is now verified. Redirecting...',
                    duration: 3000,
                });
                await refreshUser();
                setTimeout(() => onComplete?.(), 1500);
            } else {
                toast.info('Not verified yet', {
                    description: 'Please click the verification link in your email',
                    duration: 4000,
                });
            }
        } catch (error) {
            console.error('Error checking status:', error);
            toast.error('Failed to check verification status');
        } finally {
            setCheckingStatus(false);
        }
    };

    if (emailSent) {
        return (
            <div className="mx-auto max-w-md space-y-6">
                <Card className="border-2 border-emerald-200 dark:border-emerald-800">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                            <Mail className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <CardTitle className="mt-4 text-2xl">Check Your Email</CardTitle>
                        <CardDescription className="text-base">
                            We've sent a verification link to <strong>{verificationEmail}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-4 text-center text-sm text-emerald-700 dark:text-emerald-300">
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <p>Click the link in your email to verify your account</p>
                            </div>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            The verification link will expire in 24 hours.
                        </p>

                        {emailError && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-950/50 p-3 text-center text-sm text-red-700 dark:text-red-300">
                                <div className="flex items-center justify-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <p>{emailError}</p>
                                </div>
                            </div>
                        )}

                        {/* Check Verification Status Button */}
                        <Button
                            onClick={handleCheckVerificationStatus}
                            disabled={checkingStatus}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            {checkingStatus ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    I've Verified My Email
                                </>
                            )}
                        </Button>

                        {/* Resend Email Button */}
                        <Button
                            variant="outline"
                            onClick={handleResendEmail}
                            disabled={resending}
                            className="w-full"
                        >
                            {resending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend Verification Email
                                </>
                            )}
                        </Button>

                        {/* Go Back Button */}
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => {
                                setEmailSent(false);
                                setEmailError(null);
                            }}
                        >
                            Go Back & Change Role
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

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

            {/* Email Input for Verification */}
            {selectedRole && (
                <Card>
                    <CardContent className="pt-6">
                        <Label htmlFor="verificationEmail">
                            {selectedRole === 'student' ? 'College Email' : 'Company Email'}
                        </Label>
                        <Input
                            id="verificationEmail"
                            type="email"
                            placeholder={selectedRole === 'student' ? 'Enter your college email (e.g., name@college.edu)' : 'Enter your company email'}
                            value={verificationEmail}
                            onChange={(e) => setVerificationEmail(e.target.value)}
                            className="mt-2"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                            We'll send a verification link to this email to confirm your {selectedRole === 'student' ? 'student' : 'company'} status.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Continue Button */}
            <Button
                onClick={handleContinue}
                disabled={!selectedRole || !verificationEmail.trim() || (selectedRole === 'corporate' && !companyName.trim()) || loading}
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
                        Sending verification email...
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
