'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  Target,
  Loader2,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';
import { DashboardAnalytics } from '@/components/dashboard/DashboardAnalytics';
import { ChatBot } from '@/components/chatbot/ChatBot';

interface DashboardStats {
  matchedScholarships: number;
  documentsUploaded: number;
  savedScholarships: number;
  appliedScholarships: number;
  profileComplete: boolean;
}

interface Deadline {
  id: string;
  name: string;
  deadline: string;
  amount: string;
  daysLeft: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    matchedScholarships: 0,
    documentsUploaded: 0,
    savedScholarships: 0,
    appliedScholarships: 0,
    profileComplete: false
  });
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router, isConfigured]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        const response = await fetch(`/api/profile?uid=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          // Use actual data if available, otherwise use demo data
          const hasData = data.savedScholarships?.length > 0 || data.documents?.length > 0;
          setStats({
            matchedScholarships: hasData ? (data.matchedScholarships || 0) : 12,
            documentsUploaded: data.documents?.length || (hasData ? 0 : 3),
            savedScholarships: data.savedScholarships?.length || (hasData ? 0 : 5),
            appliedScholarships: data.appliedScholarships?.length || (hasData ? 0 : 2),
            profileComplete: data.profile?.isComplete || false
          });

          // Add demo deadlines if no data
          if (!hasData) {
            setDeadlines([
              {
                id: '1',
                name: 'NSP Post-Matric Scholarship',
                deadline: '2025-03-15',
                amount: '₹20,000',
                daysLeft: 45
              },
              {
                id: '2',
                name: 'AICTE Pragati Scholarship',
                deadline: '2025-02-28',
                amount: '₹50,000',
                daysLeft: 30
              },
              {
                id: '3',
                name: 'State Merit Scholarship',
                deadline: '2025-02-15',
                amount: '₹15,000',
                daysLeft: 17
              }
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set demo data on error
        setStats({
          matchedScholarships: 12,
          documentsUploaded: 3,
          savedScholarships: 5,
          appliedScholarships: 2,
          profileComplete: false
        });
        setDeadlines([
          {
            id: '1',
            name: 'NSP Post-Matric Scholarship',
            deadline: '2025-03-15',
            amount: '₹20,000',
            daysLeft: 45
          },
          {
            id: '2',
            name: 'AICTE Pragati Scholarship',
            deadline: '2025-02-28',
            amount: '₹50,000',
            daysLeft: 30
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDashboardData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Configuration Required</CardTitle>
            <CardDescription>
              Firebase is not configured. Please set up environment variables.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Matched Scholarships',
      value: stats.matchedScholarships.toString(),
      description: stats.matchedScholarships === 0 ? 'Complete profile to find matches' : 'Based on your profile',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: 'Documents Uploaded',
      value: stats.documentsUploaded.toString(),
      description: stats.documentsUploaded === 0 ? 'Upload documents for verification' : `${stats.documentsUploaded} document(s)`,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'Saved Scholarships',
      value: stats.savedScholarships.toString(),
      description: stats.savedScholarships === 0 ? 'Save scholarships to track' : 'Bookmarked for later',
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
    },
    {
      title: 'Applications',
      value: stats.appliedScholarships.toString(),
      description: stats.appliedScholarships === 0 ? 'Start applying today' : 'Applications submitted',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Here&apos;s an overview of your scholarship journey
        </p>
      </div>

      {/* Profile Completion Alert */}
      {!stats.profileComplete && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
              <UserCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Complete Your Profile</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Fill in your details to get personalized scholarship recommendations
              </p>
            </div>
            <Link href="/dashboard/profile">
              <Button className="gap-2">
                Complete Profile <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Analytics Section */}
      {user && <DashboardAnalytics userId={user.uid} />}

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <p className="text-xs text-slate-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription>Don&apos;t miss these opportunities</CardDescription>
              </div>
              <Link href="/dashboard/scholarships">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {deadlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <h4 className="font-medium text-slate-700 dark:text-slate-300">No upcoming deadlines</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Complete your profile to see matched scholarships with deadlines
                </p>
                {!stats.profileComplete && (
                  <Link href="/dashboard/profile" className="mt-4">
                    <Button variant="outline" size="sm">Complete Profile</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {deadlines.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{item.name}</h4>
                      <p className="text-sm text-orange-500">{item.daysLeft} days left</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{item.amount}</p>
                      <Button size="sm" variant="outline" className="mt-1">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get things done faster</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/scholarships">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <GraduationCap className="h-5 w-5" />
                  <span>Find Scholarships</span>
                </Button>
              </Link>
              <Link href="/dashboard/documents">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <FileText className="h-5 w-5" />
                  <span>Upload Document</span>
                </Button>
              </Link>
              <Link href="/dashboard/fees">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <Receipt className="h-5 w-5" />
                  <span>Check Fees</span>
                </Button>
              </Link>
              <Link href="/dashboard/profile">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <AlertCircle className="h-5 w-5" />
                  <span>{stats.profileComplete ? 'Edit Profile' : 'Complete Profile'}</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Getting Started Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Follow these steps to maximize your scholarship opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${stats.profileComplete ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <UserCircle className={`h-4 w-4 ${stats.profileComplete ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${stats.profileComplete ? 'text-green-700 dark:text-green-300 line-through' : 'text-slate-900 dark:text-white'}`}>
                    Complete your profile
                  </p>
                  <p className="text-xs text-slate-500">Add personal and educational details</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${stats.documentsUploaded > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <FileText className={`h-4 w-4 ${stats.documentsUploaded > 0 ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${stats.documentsUploaded > 0 ? 'text-green-700 dark:text-green-300 line-through' : 'text-slate-900 dark:text-white'}`}>
                    Upload documents
                  </p>
                  <p className="text-xs text-slate-500">Add income certificate, marksheets, etc.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${stats.matchedScholarships > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Target className={`h-4 w-4 ${stats.matchedScholarships > 0 ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${stats.matchedScholarships > 0 ? 'text-green-700 dark:text-green-300 line-through' : 'text-slate-900 dark:text-white'}`}>
                    Find matching scholarships
                  </p>
                  <p className="text-xs text-slate-500">Get AI-powered recommendations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${stats.appliedScholarships > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <GraduationCap className={`h-4 w-4 ${stats.appliedScholarships > 0 ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${stats.appliedScholarships > 0 ? 'text-green-700 dark:text-green-300 line-through' : 'text-slate-900 dark:text-white'}`}>
                    Apply for scholarships
                  </p>
                  <p className="text-xs text-slate-500">Submit applications and track progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating ChatBot */}
      <ChatBot />
    </div>
  );
}
