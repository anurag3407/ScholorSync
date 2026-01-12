'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  LayoutDashboard,
  GraduationCap,
  FileText,
  Receipt,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  Search,
  Sparkles,
  ChevronRight,
  Bookmark,
  Target,
  Lightbulb,
  ClipboardList,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SkyToggle from '@/components/ui/sky-toggle';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Scholarship Radar',
    href: '/dashboard/scholarships',
    icon: GraduationCap,
  },
  {
    title: 'My Applications',
    href: '/dashboard/applications',
    icon: ClipboardList,
  },
  {
    title: 'Saved Scholarships',
    href: '/dashboard/saved',
    icon: Bookmark,
  },
  {
    title: 'Why Not Me?',
    href: '/dashboard/why-not-me',
    icon: Target,
  },
  {
    title: 'Document Vault',
    href: '/dashboard/documents',
    icon: FileText,
  },
  {
    title: 'Fee Analyzer',
    href: '/dashboard/fees',
    icon: Receipt,
  },
  {
    title: 'Community Tips',
    href: '/dashboard/community',
    icon: Users,
  },
  {
    title: 'Smart Insights',
    href: '/dashboard/insights',
    icon: Lightbulb,
  },
  {
    title: 'Fellowships',
    href: '/fellowships/challenges',
    icon: Briefcase,
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SidebarContentProps {
  user: ReturnType<typeof useAuth>['user'];
  pathname: string;
  onLinkClick?: () => void;
}

function SidebarContent({ user, pathname, onLinkClick }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <img src={"/scholarship.png"} className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">ScholarSync</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
              {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profile?.name ? undefined : undefined} />
            <AvatarFallback suppressHydrationWarning>
              {user?.profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium" suppressHydrationWarning>{user?.profile?.name || 'User'}</p>
            <p className="truncate text-xs text-muted-foreground" suppressHydrationWarning>{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-card lg:block">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent user={user} pathname={pathname} onLinkClick={() => setIsSidebarOpen(false)} />
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
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search scholarships..."
                className="h-10 w-64 rounded-lg border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                suppressHydrationWarning
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <SkyToggle />

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={undefined} />
                    <AvatarFallback suppressHydrationWarning>
                      {user?.profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium" suppressHydrationWarning>{user?.profile?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>{user?.email}</p>
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
