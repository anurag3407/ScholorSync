'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserFellowshipProfile } from '@/lib/firebase/fellowships';

export default function FellowshipsRedirect() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkRoleAndRedirect = async () => {
            if (loading) return;

            if (!user?.uid) {
                // Not logged in - layout will handle login redirect
                setChecking(false);
                return;
            }

            try {
                const profile = await getUserFellowshipProfile(user.uid);

                if (profile?.role) {
                    // User has a role - redirect to challenges
                    router.replace('/fellowships/challenges');
                } else {
                    // No role set - redirect to onboarding
                    router.replace('/fellowships/onboarding');
                }
            } catch (error) {
                console.error('Error checking fellowship profile:', error);
                // Default to onboarding on error
                router.replace('/fellowships/onboarding');
            }
        };

        checkRoleAndRedirect();
    }, [user?.uid, loading, router]);

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                <p className="text-muted-foreground">Loading your profile...</p>
            </div>
        </div>
    );
}
