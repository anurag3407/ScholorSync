'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Target,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Lightbulb,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import type { WhyNotMeResult } from '@/types';

export default function WhyNotMePage() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<WhyNotMeResult[]>([]);

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router, isConfigured]);

  const loadAnalysis = useCallback(async () => {
    if (!user) return;

    setAnalyzing(true);
    try {
      const response = await fetch('/api/scholarships/why-not-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          minMatchPercentage: 40,
          maxMatchPercentage: 79,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to analyze scholarships');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load analysis');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAnalysis();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, loadAnalysis]);

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
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          Why Not Me?
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Discover scholarships you&apos;re close to qualifying for and learn what you need to improve
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <CardContent className="flex items-start gap-4 py-4">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
            <Lightbulb className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Near-Miss Scholarship Analysis
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              We analyze scholarships where you meet 40-79% of criteria. Focus on these to
              maximize your chances with small improvements!
            </p>
          </div>
          <Button onClick={loadAnalysis} disabled={analyzing} className="gap-2">
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Refresh Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {analyzing ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Analyzing scholarships to find your best opportunities...
            </p>
          </div>
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Great News!
            </h3>
            <p className="text-center text-slate-600 dark:text-slate-400 max-w-md">
              You either already qualify for most scholarships, or you need to improve multiple
              criteria. Check the main scholarship feed for fully qualified matches.
            </p>
            <Link href="/dashboard/scholarships" className="mt-4">
              <Button className="gap-2">
                View All Scholarships <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Found {results.length} Near-Miss {results.length === 1 ? 'Scholarship' : 'Scholarships'}
            </h2>
          </div>

          {results.map((result, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{result.scholarship.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {result.scholarship.provider}
                    </CardDescription>
                  </div>
                  <Badge className="text-lg font-semibold px-4 py-2">
                    ₹{result.scholarship.amount.toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Match Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Current Match
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {result.gapPercentage}% qualified
                    </span>
                  </div>
                  <Progress value={result.gapPercentage} className="h-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Just {100 - result.gapPercentage}% away from qualifying!
                  </p>
                </div>

                {/* Missing Criteria */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    What You${''} re Missing
                  </h4>
                  <div className="space-y-2">
                    {result.missingCriteria.map((criteria, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900"
                      >
                        <XCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {criteria.criterion}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            Current: {criteria.currentValue} • Required: {criteria.requiredValue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-green-500" />
                    How to Qualify
                  </h4>
                  <div className="space-y-2">
                    {result.missingCriteria
                      .filter((c) => c.actionable && c.suggestion)
                      .map((criteria, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                        >
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {criteria.suggestion}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <Link href={`/dashboard/scholarships`}>
                    <Button className="w-full gap-2">
                      View Full Scholarship Details <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tips Card */}
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
            <TrendingUp className="h-5 w-5" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Focus on scholarships where you&apos;re closest to qualifying (70%+ match)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Update your profile regularly as you achieve academic milestones</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Some criteria like income or category can&apos;t be changed, so focus on academics</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Keep your documents updated to quickly apply when you qualify</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
