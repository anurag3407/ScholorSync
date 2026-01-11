'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GraduationCap,
  Plus,
  Trash2,
  LogOut,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  RefreshCw,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  type: 'government' | 'private' | 'college';
  amount: { min: number; max: number };
  eligibility: {
    categories: string[];
    incomeLimit: number;
    minPercentage: number;
    states: string[];
    branches: string[];
    gender: string;
    yearRange: [number, number];
  };
  eligibilityText: string;
  description?: string;
  deadline: string;
  applicationUrl: string;
  documentsRequired: string[];
  sourceUrl: string;
  createdByAdmin?: boolean;
}

interface Application {
  id: string;
  odoo: string;
  userName: string;
  userEmail: string;
  scholarshipId: string;
  scholarshipName: string;
  status: 'applied' | 'pending' | 'approved' | 'rejected';
  appliedOn: Date;
}

export default function AdminDashboard() {
  const { user, isAdmin, adminCredentials, logout, loading } = useAuth();
  const router = useRouter();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state for new scholarship
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    type: 'government' as 'government' | 'private' | 'college',
    amountMin: '',
    amountMax: '',
    categories: '',
    incomeLimit: '',
    minPercentage: '',
    states: '',
    branches: '',
    gender: 'all',
    yearMin: '1',
    yearMax: '4',
    eligibilityText: '',
    description: '',
    deadline: '',
    applicationUrl: '',
    documentsRequired: '',
    sourceUrl: '',
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/auth/login');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin && adminCredentials) {
      fetchData();
    }
  }, [isAdmin, adminCredentials]);

  const fetchData = async () => {
    if (!adminCredentials) return;
    
    setIsLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: {
          'x-admin-email': adminCredentials.email,
          'x-admin-password': adminCredentials.password,
        },
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch scholarships
      const scholarshipsRes = await fetch('/api/admin/scholarships', {
        headers: {
          'x-admin-email': adminCredentials.email,
          'x-admin-password': adminCredentials.password,
        },
      });
      const scholarshipsData = await scholarshipsRes.json();
      if (scholarshipsData.success) {
        setScholarships(scholarshipsData.data || []);
      }

      // Fetch applications
      const applicationsRes = await fetch('/api/admin/applications', {
        headers: {
          'x-admin-email': adminCredentials.email,
          'x-admin-password': adminCredentials.password,
        },
      });
      const applicationsData = await applicationsRes.json();
      if (applicationsData.success) {
        setApplications(applicationsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: '',
      type: 'government',
      amountMin: '',
      amountMax: '',
      categories: '',
      incomeLimit: '',
      minPercentage: '',
      states: '',
      branches: '',
      gender: 'all',
      yearMin: '1',
      yearMax: '4',
      eligibilityText: '',
      description: '',
      deadline: '',
      applicationUrl: '',
      documentsRequired: '',
      sourceUrl: '',
    });
  };

  const handleCreateScholarship = async () => {
    if (!adminCredentials) return;

    try {
      const scholarship = {
        name: formData.name,
        provider: formData.provider,
        type: formData.type,
        amount: {
          min: parseInt(formData.amountMin) || 0,
          max: parseInt(formData.amountMax) || 0,
        },
        eligibility: {
          categories: formData.categories.split(',').map(s => s.trim()).filter(Boolean),
          incomeLimit: parseInt(formData.incomeLimit) || 0,
          minPercentage: parseInt(formData.minPercentage) || 0,
          states: formData.states.split(',').map(s => s.trim()).filter(Boolean),
          branches: formData.branches.split(',').map(s => s.trim()).filter(Boolean),
          gender: formData.gender,
          yearRange: [parseInt(formData.yearMin) || 1, parseInt(formData.yearMax) || 4] as [number, number],
        },
        eligibilityText: formData.eligibilityText,
        description: formData.description,
        deadline: formData.deadline,
        applicationUrl: formData.applicationUrl,
        documentsRequired: formData.documentsRequired.split(',').map(s => s.trim()).filter(Boolean),
        sourceUrl: formData.sourceUrl,
      };

      const res = await fetch('/api/admin/scholarships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: adminCredentials.email,
          adminPassword: adminCredentials.password,
          ...scholarship,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Scholarship created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create scholarship');
      }
    } catch (error) {
      console.error('Error creating scholarship:', error);
      toast.error('Failed to create scholarship');
    }
  };

  const handleDeleteScholarship = async (scholarshipId: string) => {
    if (!adminCredentials) return;

    try {
      const res = await fetch(`/api/admin/scholarships?id=${scholarshipId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': adminCredentials.email,
          'x-admin-password': adminCredentials.password,
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Scholarship deleted successfully');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete scholarship');
      }
    } catch (error) {
      console.error('Error deleting scholarship:', error);
      toast.error('Failed to delete scholarship');
    }
  };

  const handleUpdateApplicationStatus = async (
    userId: string,
    scholarshipId: string,
    newStatus: 'applied' | 'pending' | 'approved' | 'rejected'
  ) => {
    if (!adminCredentials) return;

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: adminCredentials.email,
          adminPassword: adminCredentials.password,
          userId,
          scholarshipId,
          newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Application status updated to ${newStatus}`);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Applied</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">ScholarSync Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Scholarships</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview?.totalScholarships || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.scholarships?.adminCreated || 0} added by admin
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview?.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.applications?.pending || 0} pending review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.applications?.approvalRate || 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="scholarships" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scholarships" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Scholarships
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Users className="h-4 w-4" />
              Applications
            </TabsTrigger>
          </TabsList>

          {/* Scholarships Tab */}
          <TabsContent value="scholarships" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Manage Scholarships</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Scholarship
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Scholarship</DialogTitle>
                    <DialogDescription>
                      Fill in the scholarship details. This will be shown to users immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Scholarship Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Merit Scholarship 2024"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider">Provider *</Label>
                        <Input
                          id="provider"
                          value={formData.provider}
                          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                          placeholder="e.g., Government of India"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="government">Government</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="college">College</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amountMin">Min Amount (₹)</Label>
                        <Input
                          id="amountMin"
                          type="number"
                          value={formData.amountMin}
                          onChange={(e) => setFormData({ ...formData, amountMin: e.target.value })}
                          placeholder="10000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amountMax">Max Amount (₹)</Label>
                        <Input
                          id="amountMax"
                          type="number"
                          value={formData.amountMax}
                          onChange={(e) => setFormData({ ...formData, amountMax: e.target.value })}
                          placeholder="50000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categories">Categories (comma-separated)</Label>
                      <Input
                        id="categories"
                        value={formData.categories}
                        onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                        placeholder="General, OBC, SC, ST, EWS"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="incomeLimit">Income Limit (₹)</Label>
                        <Input
                          id="incomeLimit"
                          type="number"
                          value={formData.incomeLimit}
                          onChange={(e) => setFormData({ ...formData, incomeLimit: e.target.value })}
                          placeholder="800000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minPercentage">Min Percentage (%)</Label>
                        <Input
                          id="minPercentage"
                          type="number"
                          value={formData.minPercentage}
                          onChange={(e) => setFormData({ ...formData, minPercentage: e.target.value })}
                          placeholder="60"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="states">States (comma-separated, leave empty for all)</Label>
                      <Input
                        id="states"
                        value={formData.states}
                        onChange={(e) => setFormData({ ...formData, states: e.target.value })}
                        placeholder="Maharashtra, Karnataka, Tamil Nadu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branches">Branches (comma-separated, leave empty for all)</Label>
                      <Input
                        id="branches"
                        value={formData.branches}
                        onChange={(e) => setFormData({ ...formData, branches: e.target.value })}
                        placeholder="Engineering, Medical, Arts"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(v) => setFormData({ ...formData, gender: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Male">Male Only</SelectItem>
                            <SelectItem value="Female">Female Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearMin">Year Min</Label>
                        <Select
                          value={formData.yearMin}
                          onValueChange={(v) => setFormData({ ...formData, yearMin: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(y => (
                              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearMax">Year Max</Label>
                        <Select
                          value={formData.yearMax}
                          onValueChange={(v) => setFormData({ ...formData, yearMax: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(y => (
                              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eligibilityText">Eligibility Text *</Label>
                      <Textarea
                        id="eligibilityText"
                        value={formData.eligibilityText}
                        onChange={(e) => setFormData({ ...formData, eligibilityText: e.target.value })}
                        placeholder="Detailed eligibility criteria..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the scholarship..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="applicationUrl">Application URL *</Label>
                      <Input
                        id="applicationUrl"
                        value={formData.applicationUrl}
                        onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                        placeholder="https://example.com/apply"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentsRequired">Documents Required (comma-separated)</Label>
                      <Input
                        id="documentsRequired"
                        value={formData.documentsRequired}
                        onChange={(e) => setFormData({ ...formData, documentsRequired: e.target.value })}
                        placeholder="Income Certificate, Caste Certificate, Marksheet"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sourceUrl">Source URL</Label>
                      <Input
                        id="sourceUrl"
                        value={formData.sourceUrl}
                        onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                        placeholder="https://example.com/scholarship-info"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateScholarship}>
                      Create Scholarship
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {scholarships.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No scholarships found</p>
                      <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Scholarship
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  scholarships.map((scholarship) => (
                    <Card key={scholarship.id}>
                      <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{scholarship.name}</CardTitle>
                            {scholarship.createdByAdmin && (
                              <Badge variant="secondary" className="text-xs">Admin Added</Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">
                            {scholarship.provider} • {scholarship.type}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteScholarship(scholarship.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <p className="font-medium">
                              ₹{scholarship.amount?.min?.toLocaleString()} - ₹{scholarship.amount?.max?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Deadline:</span>
                            <p className="font-medium">{scholarship.deadline || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Categories:</span>
                            <p className="font-medium">
                              {scholarship.eligibility?.categories?.join(', ') || 'All'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min %:</span>
                            <p className="font-medium">
                              {scholarship.eligibility?.minPercentage || 0}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <h2 className="text-lg font-semibold">Manage Applications</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No applications yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  applications.map((application) => (
                    <Card key={application.id}>
                      <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div>
                          <CardTitle className="text-lg">{application.scholarshipName}</CardTitle>
                          <CardDescription>
                            Applied by: {application.userName} ({application.userEmail})
                          </CardDescription>
                        </div>
                        {getStatusBadge(application.status)}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Applied on: {new Date(application.appliedOn).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={application.status === 'pending' ? 'default' : 'outline'}
                              onClick={() => handleUpdateApplicationStatus(
                                application.odoo,
                                application.scholarshipId,
                                'pending'
                              )}
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Button>
                            <Button
                              size="sm"
                              variant={application.status === 'approved' ? 'default' : 'outline'}
                              className={application.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                              onClick={() => handleUpdateApplicationStatus(
                                application.odoo,
                                application.scholarshipId,
                                'approved'
                              )}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant={application.status === 'rejected' ? 'destructive' : 'outline'}
                              onClick={() => handleUpdateApplicationStatus(
                                application.odoo,
                                application.scholarshipId,
                                'rejected'
                              )}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
