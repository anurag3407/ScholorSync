'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Sparkles,
  AlertCircle,
  Loader2,
  GraduationCap,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import type { ScholarshipMatch } from '@/types';
import { ChatBot } from '@/components/chatbot/ChatBot';

export default function ScholarshipsPage() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [matchedScholarships, setMatchedScholarships] = useState<ScholarshipMatch[]>([]);
  const [nearMissScholarships, setNearMissScholarships] = useState<ScholarshipMatch[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const hasAutoFetched = useRef(false);

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router, isConfigured]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const response = await fetch(`/api/profile?uid=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setProfileComplete(data.profile?.isComplete || false);
          setSavedIds(data.savedScholarships?.map((s: { id: string }) => s.id) || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const findScholarships = async () => {
    if (!user || !profileComplete) return;

    setMatching(true);
    try {
      const response = await fetch('/api/scholarships/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid })
      });

      if (response.ok) {
        const data = await response.json();
        const matched = data.scholarships?.filter((s: ScholarshipMatch) => s.matchPercentage >= 70) || [];
        const nearMiss = data.scholarships?.filter((s: ScholarshipMatch) =>
          s.matchPercentage >= 40 && s.matchPercentage < 70
        ) || [];
        setMatchedScholarships(matched);
        setNearMissScholarships(nearMiss);
      }
    } catch (error) {
      console.error('Error finding scholarships:', error);
    } finally {
      setMatching(false);
    }
  };

  // Auto-fetch scholarships when page loads and profile is complete
  useEffect(() => {
    if (!loading && !authLoading && user && profileComplete && !hasAutoFetched.current) {
      hasAutoFetched.current = true;
      findScholarships();
    }
  }, [loading, authLoading, user, profileComplete]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Scholarship Radar
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            AI-powered scholarship matching based on your profile
          </p>
        </div>
        {profileComplete && (
          <Button
            onClick={findScholarships}
            disabled={matching}
            className="gap-2"
          >
            {matching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Find Scholarships
              </>
            )}
          </Button>
        )}
      </div>

      {/* Profile Incomplete Alert */}
      {!profileComplete && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Complete Your Profile First</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                To find matching scholarships, please complete your profile with all required information.
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

      {/* Tabs for different views */}
      <Tabs defaultValue="matched" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matched" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Matched ({matchedScholarships.length})
          </TabsTrigger>
          <TabsTrigger value="near-miss" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Near Miss ({nearMissScholarships.length})
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved ({savedIds.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matched" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Matched Scholarships</CardTitle>
              <CardDescription>
                Based on your profile, you qualify for these scholarships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matchedScholarships.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GraduationCap className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300">No matched scholarships yet</h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-md">
                    {profileComplete
                      ? "Click 'Find Scholarships' to discover scholarships matching your profile"
                      : "Complete your profile to find matching scholarships"
                    }
                  </p>
                  {profileComplete ? (
                    <Button onClick={findScholarships} disabled={matching} className="mt-4 gap-2">
                      {matching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Find Scholarships
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link href="/dashboard/profile" className="mt-4">
                      <Button>Complete Profile</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {matchedScholarships.map((scholarship) => (
                    <div
                      key={scholarship.id}
                      className="rounded-lg border p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {scholarship.name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {scholarship.provider}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {scholarship.matchPercentage}% Match
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                        <span>
                          Amount: ₹{scholarship.amount.min.toLocaleString()} - ₹{scholarship.amount.max.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            alert(`${scholarship.name}\n\nProvider: ${scholarship.provider}\nAmount: ₹${scholarship.amount.min.toLocaleString()} - ₹${scholarship.amount.max.toLocaleString()}\nDeadline: ${scholarship.deadline}\nEligibility: ${scholarship.eligibilityText}\n\nDocuments Required:\n${scholarship.documentsRequired.join('\n')}`);
                          }}
                        >
                          View Details
                        </Button>
                        {scholarship.applicationUrl ? (
                          <Button
                            size="sm"
                            onClick={() => window.open(scholarship.applicationUrl, '_blank', 'noopener,noreferrer')}
                          >
                            Apply
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                              if (!user) return;
                              try {
                                const res = await fetch('/api/scholarships/apply', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    uid: user.uid,
                                    scholarshipId: scholarship.id,
                                  }),
                                });
                                const data = await res.json();
                                if (data.success) {
                                  alert('Application submitted successfully!');
                                } else {
                                  alert(data.error || 'Failed to submit application');
                                }
                              } catch (error) {
                                console.error('Error applying:', error);
                                alert('Failed to submit application');
                              }
                            }}
                          >
                            Apply Here
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="near-miss" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Why Not Me? - Near Miss Scholarships</CardTitle>
              <CardDescription>
                You&apos;re close to qualifying for these. See what you need to do.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nearMissScholarships.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300">No near-miss scholarships</h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-md">
                    {profileComplete
                      ? "Search for scholarships to see which ones you're close to qualifying for"
                      : "Complete your profile to find near-miss scholarships"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nearMissScholarships.map((scholarship) => (
                    <div
                      key={scholarship.id}
                      className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {scholarship.name}
                          </h4>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            Match Score: {scholarship.matchPercentage}%
                          </p>
                        </div>
                      </div>
                      {scholarship.eligibility.missingRequirements && scholarship.eligibility.missingRequirements.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            What you need:
                          </p>
                          <ul className="mt-1 list-inside list-disc text-sm text-slate-600 dark:text-slate-400">
                            {scholarship.eligibility.missingRequirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => {
                          alert(`${scholarship.name}\n\nProvider: ${scholarship.provider}\nAmount: ₹${scholarship.amount.min.toLocaleString()} - ₹${scholarship.amount.max.toLocaleString()}\nMatch: ${scholarship.matchPercentage}%\nEligibility: ${scholarship.eligibilityText}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Scholarships</CardTitle>
              <CardDescription>
                Scholarships you&apos;ve bookmarked for later
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GraduationCap className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300">No saved scholarships</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    Save scholarships from the Matched tab to access them quickly
                  </p>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">
                  You have {savedIds.length} saved scholarship(s).
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating ChatBot */}
      <ChatBot />
    </div>
  );
}
