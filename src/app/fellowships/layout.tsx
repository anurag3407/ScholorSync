'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserFellowshipProfile } from '@/lib/firebase/fellowships';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Briefcase,
    Home,
    FileText,
    FolderKanban,
    PlusCircle,
    LogOut,
    Menu,
    Settings,
    ShieldCheck,
    GraduationCap,
    Building2,
    Sparkles,
    Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SkyToggle from '@/components/ui/sky-toggle';
import type { UserRole } from '@/types/fellowships';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    roles: UserRole[];
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    {
        title: 'Browse Challenges',
        href: '/fellowships/challenges',
        icon: Briefcase,
        roles: ['student', 'corporate'],
    },
    {
        title: 'My Proposals',
        href: '/fellowships/my-proposals',
        icon: FileText,
        roles: ['student'],
    },
    {
        title: 'My Challenges',
        href: '/fellowships/my-challenges',
        icon: FolderKanban,
        roles: ['corporate'],
    },
    {
        title: 'Post Challenge',
        href: '/fellowships/create-challenge',
        icon: PlusCircle,
        roles: ['corporate'],
    },
    {
        title: 'Project Rooms',
        href: '/fellowships/rooms',
        icon: Home,
        roles: ['student', 'corporate'],
    },
    {
        title: 'Admin Panel',
        href: '/fellowships/admin',
        icon: Shield,
        roles: ['student', 'corporate'],
        adminOnly: true,
    },
];

export default function FellowshipsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, logout, isAdmin } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [roleLoading, setRoleLoading] = useState(true);

    // Check if we're on the onboarding page
    const isOnboardingPage = pathname === '/fellowships/onboarding';

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login?redirect=/fellowships');
        }
    }, [user, loading, router]);

    // Load fellowship profile from Firestore
    useEffect(() => {
        const loadFellowshipProfile = async () => {
            if (!user?.uid) {
                setRoleLoading(false);
                return;
            }

            // Don't check if we're on onboarding page - let user complete it
            if (isOnboardingPage) {
                setRoleLoading(false);
                return;
            }

            try {
                console.log('[Fellowship] Loading profile for user:', user.uid);
                const profile = await getUserFellowshipProfile(user.uid);
                console.log('[Fellowship] Profile loaded:', profile);

                if (profile?.role) {
                    setUserRole(profile.role);
                    setIsVerified(profile.isVerified || false);
                } else {
                    // No role set - redirect to onboarding
                    console.log('[Fellowship] No role found, redirecting to onboarding');
                    router.push('/fellowships/onboarding');
                    return; // Don't set roleLoading to false yet
                }
            } catch (error) {
                console.error('Error loading fellowship profile:', error);
            }
            setRoleLoading(false);
        };

        if (user?.uid && !loading) {
            loadFellowshipProfile();
        }
    }, [user?.uid, loading, isOnboardingPage, router]);

    if (loading || roleLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const filteredNavItems = navItems.filter(
        (item) => {
            // Filter by role
            if (userRole && !item.roles.includes(userRole)) return false;
            // Filter admin-only items
            if (item.adminOnly && !isAdmin) return false;
            return true;
        }
    );



    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/fellowships/challenges" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500">
                        <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold leading-tight">Fellowships</span>
                        <span className="text-[10px] text-muted-foreground">by ScholarSync</span>
                    </div>
                </Link>
            </div>

            {/* Role Badge */}
            <div className="border-b px-4 py-3">
                <div className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                    userRole === 'corporate'
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                )}>
                    {userRole === 'corporate' ? (
                        <>
                            <Building2 className="h-4 w-4" />
                            Corporate Account
                        </>
                    ) : (
                        <>
                            <GraduationCap className="h-4 w-4" />
                            Student Account
                        </>
                    )}
                </div>

                {userRole === 'student' && !isVerified && (
                    <Link href="/fellowships/verify" onClick={onLinkClick}>
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">
                            <ShieldCheck className="h-4 w-4" />
                            Verify to Apply →
                        </div>
                    </Link>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onLinkClick}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.title}
                        </Link>
                    );
                })}

                {/* Divider */}
                <div className="my-4 border-t" />

                {/* Back to ScholarSync */}
                <Link
                    href="/dashboard"
                    onClick={onLinkClick}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Sparkles className="h-5 w-5" />
                    Back to Scholarships
                </Link>
            </nav>

            {/* User Info */}
            <div className="border-t p-4">
                <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>
                            {user?.profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">
                            {user?.profile?.name || 'User'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {user?.email}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 border-r bg-card lg:block">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetContent side="left" className="w-64 p-0">
                    <SidebarContent onLinkClick={() => setIsSidebarOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="lg:hidden"
                                    onClick={() => setIsSidebarOpen(true)}
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                        </Sheet>
                        <h1 className="text-lg font-semibold lg:hidden">Fellowships</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <SkyToggle />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>
                                            {user?.profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user?.profile?.name || 'User'}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/profile">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
