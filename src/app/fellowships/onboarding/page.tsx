'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RoleSelector } from '@/components/fellowships/RoleSelector';
import { getUserFellowshipProfile } from '@/lib/firebase/fellowships';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [checkingRole, setCheckingRole] = useState(true);

    // Check if user already has a role and redirect if so
    useEffect(() => {
        const checkExistingRole = async () => {
            if (loading) return;

            if (!user?.uid) {
                setCheckingRole(false);
                return;
            }

            try {
                const profile = await getUserFellowshipProfile(user.uid);
                if (profile?.role) {
                    // Already has role - redirect to challenges
                    router.replace('/fellowships/challenges');
                    return;
                }
            } catch (error) {
                console.error('Error checking role:', error);
            }
            setCheckingRole(false);
        };

        checkExistingRole();
    }, [user?.uid, loading, router]);

    const handleComplete = () => {
        // Force a full page reload to ensure layout picks up the new role
        window.location.href = '/fellowships/challenges';
    };

    if (loading || checkingRole) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-12">
            <RoleSelector onComplete={handleComplete} />
        </div>
    );
}
