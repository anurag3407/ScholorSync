'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  FileText,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Scholarship, AppliedScholarship } from '@/types';

interface ApplicationWithDetails extends AppliedScholarship {
  scholarship?: Scholarship;
}

export default function ApplicationsPage() {
  const { user, loading: authLoading, isConfigured, refreshUser } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router, isConfigured]);

  const loadApplications = async () => {
    if (!user) return;
    
    try {
      // Fetch latest user data
      const profileResponse = await fetch(`/api/profile?uid=${user.uid}`);
      let appliedScholarships: AppliedScholarship[] = [];
      
      if (profileResponse.ok) {
        const userData = await profileResponse.json();
        appliedScholarships = userData.appliedScholarships || [];
      } else {
        appliedScholarships = user.appliedScholarships || [];
      }

      if (appliedScholarships.length > 0) {
        // Fetch scholarship details
        const scholarshipsResponse = await fetch('/api/scholarships');
        if (scholarshipsResponse.ok) {
          const allScholarships = await scholarshipsResponse.json();
          
          const applicationsWithDetails = appliedScholarships.map(app => {
            const scholarship = allScholarships.find((s: Scholarship) => s.id === app.id);
            return {
              ...app,
              scholarship,
            };
          });
          
          // Sort by applied date (most recent first)
          applicationsWithDetails.sort((a, b) => {
            const dateA = new Date(a.appliedOn).getTime();
            const dateB = new Date(b.appliedOn).getTime();
            return dateB - dateA;
          });
          
          setApplications(applicationsWithDetails);
        }
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadApplications();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await loadApplications();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'applied':
        return {
          icon: Clock,
          label: 'Applied',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300',
          progress: 25,
        };
      case 'pending':
        return {
          icon: AlertCircle,
          label: 'Under Review',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300',
          progress: 50,
        };
      case 'approved':
        return {
          icon: CheckCircle,
          label: 'Approved',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          progress: 100,
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          progress: 100,
        };
      default:
        return {
          icon: Clock,
          label: status,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300',
          progress: 0,
        };
    }
  };

  const getStatusBadge = (status: string) => {
    const info = getStatusInfo(status);
    const Icon = info.icon;
    
    return (
      <Badge className={`${info.bgColor} ${info.color} border ${info.borderColor}`}>
        <Icon className="mr-1 h-3 w-3" />
        {info.label}
      </Badge>
    );
  };

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
              Firebase is not configured. Please check your environment variables.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground mt-2">
            Track the status of your scholarship applications
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.applied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              You haven't applied for any scholarships yet. Browse available scholarships and start applying!
            </p>
            <Button onClick={() => router.push('/dashboard/scholarships')}>
              Browse Scholarships
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const statusInfo = getStatusInfo(application.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={application.id} className={`border-l-4 ${statusInfo.borderColor}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {application.scholarship?.name || 'Unknown Scholarship'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {application.scholarship?.provider || 'Unknown Provider'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Application Progress</span>
                      <span>{statusInfo.progress}%</span>
                    </div>
                    <Progress 
                      value={statusInfo.progress} 
                      className={`h-2 ${application.status === 'rejected' ? '[&>div]:bg-red-500' : application.status === 'approved' ? '[&>div]:bg-green-500' : ''}`}
                    />
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Applied On</span>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(application.appliedOn).toLocaleDateString()}
                      </p>
                    </div>
                    {application.scholarship && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Amount</span>
                          <p className="font-medium">
                            ₹{application.scholarship.amount?.min?.toLocaleString()} - ₹{application.scholarship.amount?.max?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type</span>
                          <p className="font-medium capitalize">{application.scholarship.type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deadline</span>
                          <p className="font-medium">{application.scholarship.deadline || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Status Message */}
                  <div className={`p-3 rounded-lg ${statusInfo.bgColor}`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      <span className={`text-sm font-medium ${statusInfo.color}`}>
                        {application.status === 'applied' && 'Your application has been submitted and is awaiting review.'}
                        {application.status === 'pending' && 'Your application is currently under review by the scholarship committee.'}
                        {application.status === 'approved' && 'Congratulations! Your application has been approved.'}
                        {application.status === 'rejected' && 'Unfortunately, your application was not selected this time.'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {application.scholarship?.applicationUrl && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(application.scholarship?.applicationUrl, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Original
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
