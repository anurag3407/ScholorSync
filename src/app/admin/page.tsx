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
import { Switch } from '@/components/ui/switch';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Briefcase,
  MessageSquare,
  AlertTriangle,
  IndianRupee,
  Home,
  Search,
  Eye,
  LayoutDashboard,
  Loader2,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getChallenges } from '@/lib/firebase/fellowships';
import type { Challenge, ProjectRoom } from '@/types/fellowships';
import { CHALLENGE_CATEGORIES, CHALLENGE_STATUS_LABELS } from '@/types/fellowships';

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
  userProfile?: {
    name?: string;
    category?: string;
    income?: number;
    percentage?: number;
    branch?: string;
    year?: number;
    state?: string;
    college?: string;
    gender?: string;
  };
  scholarshipId: string;
  scholarshipName: string;
  scholarshipProvider?: string;
  scholarshipAmount?: { min: number; max: number };
  status: 'applied' | 'document_review' | 'pending' | 'approved' | 'rejected';
  appliedOn: Date;
  statusUpdatedAt?: Date;
  documents?: Record<string, string>;
}

export default function AdminDashboard() {
  const { user, isAdmin, adminCredentials, logout, loading } = useAuth();
  const router = useRouter();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rooms, setRooms] = useState<ProjectRoom[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showOnlyMyScholarships, setShowOnlyMyScholarships] = useState(true); // Default to admin-only
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<(ProjectRoom & { messages?: any[] }) | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

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
      router.push('/admin/login');
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

      try {
        const fellowshipsRes = await fetch('/api/admin/fellowships', {
          headers: {
            'x-admin-email': adminCredentials.email,
            'x-admin-password': adminCredentials.password,
          },
        });
        const fellowshipsData = await fellowshipsRes.json();
        if (fellowshipsData.success && fellowshipsData.data) {
          setChallenges(fellowshipsData.data);
        } else {
          setChallenges(getMockChallenges());
        }
        const roomsRes = await fetch('/api/admin/rooms', {
          headers: {
            'x-admin-email': adminCredentials.email,
            'x-admin-password': adminCredentials.password,
          },
        });
        const roomsData = await roomsRes.json();
        if (roomsData.success && roomsData.data) {
          setRooms(roomsData.data);
        } else {
          setRooms(getMockRooms());
        }
      } catch (error) {
        console.error('Error loading fellowship data:', error);
        setChallenges(getMockChallenges());
        setRooms(getMockRooms());
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

  // Handle challenge status update (cancel, complete)
  const handleUpdateChallengeStatus = async (challengeId: string, status: string) => {
    if (!adminCredentials) return;

    try {
      const res = await fetch('/api/admin/fellowships', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: adminCredentials.email,
          adminPassword: adminCredentials.password,
          challengeId,
          status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Challenge status updated to ${status}`);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update challenge');
      }
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast.error('Failed to update challenge');
    }
  };

  // Handle escrow release/dispute
  const handleEscrowAction = async (roomId: string, action: 'release' | 'refund') => {
    if (!adminCredentials) return;

    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: adminCredentials.email,
          adminPassword: adminCredentials.password,
          roomId,
          action,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update escrow');
      }
    } catch (error) {
      console.error('Error updating escrow:', error);
      toast.error('Failed to update escrow');
    }
  };

  // Fetch room messages for inline viewing
  const handleViewRoomMessages = async (roomId: string) => {
    if (!adminCredentials) return;

    try {
      const res = await fetch(`/api/admin/rooms?id=${roomId}&messages=true`, {
        headers: {
          'x-admin-email': adminCredentials.email,
          'x-admin-password': adminCredentials.password,
        },
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSelectedRoom(data.data);
      } else {
        toast.error('Failed to load room details');
      }
    } catch (error) {
      console.error('Error loading room:', error);
      toast.error('Failed to load room');
    }
  };

  const handleUpdateApplicationStatus = async (
    userId: string,
    scholarshipId: string,
    newStatus: 'applied' | 'document_review' | 'pending' | 'approved' | 'rejected'
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
      case 'document_review':
        return <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-500/10"><FileText className="mr-1 h-3 w-3" />Document Review</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-500/10"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter scholarships - Only show admin-created scholarships
  const filteredScholarships = scholarships.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchQuery.toLowerCase());
    // Always filter to admin-created scholarships only
    return matchesSearch && s.createdByAdmin === true;
  });

  // Fellowship stats
  const totalChallenges = challenges.length;
  const openChallenges = challenges.filter(c => c.status === 'open').length;
  const inProgressChallenges = challenges.filter(c => c.status === 'in_progress').length;
  const completedChallenges = challenges.filter(c => c.status === 'completed').length;
  const totalValue = challenges.reduce((sum, c) => sum + c.price, 0);
  const activeRooms = rooms.filter(r => r.status === 'active').length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">ScholarSync Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Shield className="mr-1 h-3 w-3" /> Admin
            </Badge>
            <Button variant="ghost" size="sm" onClick={fetchData} className="text-slate-400 hover:text-white">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="scholarships" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <GraduationCap className="h-4 w-4" />
              Scholarships
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="fellowships" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Briefcase className="h-4 w-4" />
              Fellowships
            </TabsTrigger>
            <TabsTrigger value="rooms" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4" />
              Project Rooms
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-blue-200">Total Users</CardTitle>
                  <Users className="h-5 w-5 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats?.overview?.totalUsers || 0}</div>
                  <p className="text-xs text-slate-400 mt-1">Registered users</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-200">Total Scholarships</CardTitle>
                  <GraduationCap className="h-5 w-5 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats?.overview?.totalScholarships || 0}</div>
                  <p className="text-xs text-emerald-400 mt-1">{stats?.scholarships?.adminCreated || 0} added by you</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-amber-200">Applications</CardTitle>
                  <FileText className="h-5 w-5 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats?.overview?.totalApplications || 0}</div>
                  <p className="text-xs text-amber-400 mt-1">{stats?.applications?.pending || 0} pending review</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-purple-200">Approval Rate</CardTitle>
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">{stats?.applications?.approvalRate || 0}%</div>
                  <p className="text-xs text-slate-400 mt-1">Success rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Fellowship Stats */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-xs">Challenges</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">{totalChallenges}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Open</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-green-400">{openChallenges}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">In Progress</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-blue-400">{inProgressChallenges}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Completed</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">{completedChallenges}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <IndianRupee className="h-4 w-4" />
                    <span className="text-xs">Total Value</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-emerald-400">₹{(totalValue / 1000).toFixed(0)}k</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Home className="h-4 w-4" />
                    <span className="text-xs">Active Rooms</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-amber-400">{activeRooms}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scholarships Tab */}
          <TabsContent value="scholarships" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    placeholder="Search scholarships..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-800/50 border-slate-700 text-white w-[300px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showOnlyMyScholarships}
                    onCheckedChange={setShowOnlyMyScholarships}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                  <Label className="text-slate-400 text-sm">My Scholarships Only</Label>
                </div>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Scholarship
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add New Scholarship</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Fill in the scholarship details. This will be shown to users immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-300">Scholarship Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Merit Scholarship 2024"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider" className="text-slate-300">Provider *</Label>
                        <Input
                          id="provider"
                          value={formData.provider}
                          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                          placeholder="e.g., Government of India"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-slate-300">Type *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="government">Government</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="college">College</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amountMin" className="text-slate-300">Min Amount (₹)</Label>
                        <Input
                          id="amountMin"
                          type="number"
                          value={formData.amountMin}
                          onChange={(e) => setFormData({ ...formData, amountMin: e.target.value })}
                          placeholder="10000"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amountMax" className="text-slate-300">Max Amount (₹)</Label>
                        <Input
                          id="amountMax"
                          type="number"
                          value={formData.amountMax}
                          onChange={(e) => setFormData({ ...formData, amountMax: e.target.value })}
                          placeholder="50000"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline" className="text-slate-300">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eligibilityText" className="text-slate-300">Eligibility Text *</Label>
                      <Textarea
                        id="eligibilityText"
                        value={formData.eligibilityText}
                        onChange={(e) => setFormData({ ...formData, eligibilityText: e.target.value })}
                        placeholder="Detailed eligibility criteria..."
                        rows={3}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="applicationUrl" className="text-slate-300">Application URL *</Label>
                      <Input
                        id="applicationUrl"
                        value={formData.applicationUrl}
                        onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                        placeholder="https://example.com/apply"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-700 text-slate-300">
                      Cancel
                    </Button>
                    <Button onClick={handleCreateScholarship} className="bg-emerald-600 hover:bg-emerald-700">
                      Create Scholarship
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredScholarships.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <GraduationCap className="h-12 w-12 text-slate-500 mb-4" />
                      <p className="text-slate-400">No scholarships found</p>
                      <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Scholarship
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredScholarships.map((scholarship) => (
                    <Card key={scholarship.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                      <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg text-white">{scholarship.name}</CardTitle>
                            {scholarship.createdByAdmin && (
                              <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">Admin Added</Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1 text-slate-400">
                            {scholarship.provider} • {scholarship.type}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
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
                            <span className="text-slate-500">Amount:</span>
                            <p className="font-medium text-emerald-400">
                              ₹{scholarship.amount?.min?.toLocaleString()} - ₹{scholarship.amount?.max?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Deadline:</span>
                            <p className="font-medium text-white">{scholarship.deadline || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Categories:</span>
                            <p className="font-medium text-white">
                              {scholarship.eligibility?.categories?.join(', ') || 'All'}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Min %:</span>
                            <p className="font-medium text-white">
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
            <h2 className="text-lg font-semibold text-white">Manage Applications</h2>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-slate-500 mb-4" />
                      <p className="text-slate-400">No applications yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  applications.map((application) => (
                    <Card key={application.id} className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white">{application.scholarshipName}</CardTitle>
                          <CardDescription className="text-slate-400">
                            Applied by: {application.userName} ({application.userEmail})
                          </CardDescription>
                          {application.userProfile && (
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <span className="text-slate-500">Category: <span className="text-slate-300">{application.userProfile.category || 'N/A'}</span></span>
                              <span className="text-slate-500">Year: <span className="text-slate-300">{application.userProfile.year || 'N/A'}</span></span>
                              <span className="text-slate-500">Percentage: <span className="text-slate-300">{application.userProfile.percentage || 'N/A'}%</span></span>
                              <span className="text-slate-500">College: <span className="text-slate-300">{application.userProfile.college || 'N/A'}</span></span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(application.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-3">
                          <div className="text-sm text-slate-400">
                            Applied on: {new Date(application.appliedOn).toLocaleDateString()}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant={application.status === 'document_review' ? 'default' : 'outline'}
                              onClick={() => handleUpdateApplicationStatus(
                                application.odoo,
                                application.scholarshipId,
                                'document_review'
                              )}
                              className={application.status === 'document_review' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700 text-slate-300'}
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              Document Review
                            </Button>
                            <Button
                              size="sm"
                              variant={application.status === 'pending' ? 'default' : 'outline'}
                              onClick={() => handleUpdateApplicationStatus(
                                application.odoo,
                                application.scholarshipId,
                                'pending'
                              )}
                              className={application.status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-slate-700 text-slate-300'}
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Button>
                            <Button
                              size="sm"
                              variant={application.status === 'approved' ? 'default' : 'outline'}
                              onClick={() => handleUpdateApplicationStatus(
                                application.odoo,
                                application.scholarshipId,
                                'approved'
                              )}
                              className={application.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'border-slate-700 text-slate-300'}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant={application.status === 'rejected' ? 'default' : 'outline'}
                              onClick={() => handleUpdateApplicationStatus(
                                application.odoo,
                                application.scholarshipId,
                                'rejected'
                              )}
                              className={application.status === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-700 text-slate-300'}
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

          {/* Fellowships Tab */}
          <TabsContent value="fellowships" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search challenges..."
                  className="pl-9 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">Challenge</TableHead>
                    <TableHead className="text-slate-400">Company</TableHead>
                    <TableHead className="text-slate-400">Category</TableHead>
                    <TableHead className="text-slate-400">Price</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Proposals</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((challenge) => (
                    <TableRow key={challenge.id} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white max-w-[200px] truncate">
                        {challenge.title}
                      </TableCell>
                      <TableCell className="text-slate-300">{challenge.companyName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs", CHALLENGE_CATEGORIES[challenge.category]?.color)}>
                          {CHALLENGE_CATEGORIES[challenge.category]?.label || challenge.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-emerald-400 font-medium">
                        ₹{challenge.price.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={CHALLENGE_STATUS_LABELS[challenge.status]?.color}>
                          {CHALLENGE_STATUS_LABELS[challenge.status]?.label || challenge.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{challenge.proposalCount || 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          onClick={() => setSelectedChallenge(challenge)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Project Rooms Tab */}
          <TabsContent value="rooms" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">Challenge</TableHead>
                    <TableHead className="text-slate-400">Student</TableHead>
                    <TableHead className="text-slate-400">Corporate</TableHead>
                    <TableHead className="text-slate-400">Escrow</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white max-w-[200px] truncate">
                        {room.challengeTitle}
                      </TableCell>
                      <TableCell className="text-slate-300">{room.studentName}</TableCell>
                      <TableCell className="text-slate-300">{room.corporateName}</TableCell>
                      <TableCell className="text-emerald-400 font-medium">
                        ₹{room.escrowAmount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={room.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-slate-600/20 text-slate-400 border-slate-600/30'}>
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {format(new Date(room.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          onClick={() => handleViewRoomMessages(room.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Application Details Dialog */}
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                Application Details
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Review applicant information and update status
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-400">Applicant Name</Label>
                    <p className="text-white font-medium">{selectedApplication.userName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Email</Label>
                    <p className="text-white">{selectedApplication.userEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Scholarship</Label>
                    <p className="text-emerald-400 font-medium">{selectedApplication.scholarshipName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Current Status</Label>
                    <div>{getStatusBadge(selectedApplication.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Applied On</Label>
                    <p className="text-white">{new Date(selectedApplication.appliedOn).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedApplication.userProfile && (
                  <div className="rounded-lg bg-slate-800/50 p-4 space-y-3">
                    <h4 className="text-sm font-medium text-slate-300">Applicant Profile</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-slate-500">Category:</span> <span className="text-white">{selectedApplication.userProfile.category}</span></div>
                      <div><span className="text-slate-500">Year:</span> <span className="text-white">{selectedApplication.userProfile.year}</span></div>
                      <div><span className="text-slate-500">Percentage:</span> <span className="text-white">{selectedApplication.userProfile.percentage}%</span></div>
                      <div><span className="text-slate-500">Branch:</span> <span className="text-white">{selectedApplication.userProfile.branch}</span></div>
                      <div><span className="text-slate-500">College:</span> <span className="text-white">{selectedApplication.userProfile.college}</span></div>
                      <div><span className="text-slate-500">State:</span> <span className="text-white">{selectedApplication.userProfile.state}</span></div>
                      <div><span className="text-slate-500">Gender:</span> <span className="text-white">{selectedApplication.userProfile.gender}</span></div>
                      <div><span className="text-slate-500">Income:</span> <span className="text-white">₹{selectedApplication.userProfile.income?.toLocaleString()}</span></div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
                  <Button
                    size="sm"
                    variant={selectedApplication.status === 'document_review' ? 'default' : 'outline'}
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedApplication.odoo, selectedApplication.scholarshipId, 'document_review');
                      setSelectedApplication(null);
                    }}
                    className={selectedApplication.status === 'document_review' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700 text-slate-300'}
                  >
                    <FileText className="mr-1 h-3 w-3" /> Document Review
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedApplication.status === 'pending' ? 'default' : 'outline'}
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedApplication.odoo, selectedApplication.scholarshipId, 'pending');
                      setSelectedApplication(null);
                    }}
                    className={selectedApplication.status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-slate-700 text-slate-300'}
                  >
                    <Clock className="mr-1 h-3 w-3" /> Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedApplication.status === 'approved' ? 'default' : 'outline'}
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedApplication.odoo, selectedApplication.scholarshipId, 'approved');
                      setSelectedApplication(null);
                    }}
                    className={selectedApplication.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'border-slate-700 text-slate-300'}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedApplication.status === 'rejected' ? 'default' : 'outline'}
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedApplication.odoo, selectedApplication.scholarshipId, 'rejected');
                      setSelectedApplication(null);
                    }}
                    className={selectedApplication.status === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-700 text-slate-300'}
                  >
                    <XCircle className="mr-1 h-3 w-3" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Challenge Details Dialog */}
        <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-500" />
                Challenge Details
              </DialogTitle>
            </DialogHeader>
            {selectedChallenge && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{selectedChallenge.title}</h3>
                  <p className="text-slate-400">{selectedChallenge.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <Label className="text-slate-400">Company</Label>
                    <p className="text-white">{selectedChallenge.companyName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Posted By</Label>
                    <p className="text-white">{selectedChallenge.corporateName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Price</Label>
                    <p className="text-emerald-400 font-semibold">₹{selectedChallenge.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Status</Label>
                    <Badge variant="outline" className={CHALLENGE_STATUS_LABELS[selectedChallenge.status]?.color}>
                      {CHALLENGE_STATUS_LABELS[selectedChallenge.status]?.label}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Proposals</Label>
                    <p className="text-white">{selectedChallenge.proposalCount || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Deadline</Label>
                    <p className="text-white">{format(new Date(selectedChallenge.deadline), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Room Details Dialog */}
        <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-500" />
                Project Room Details
              </DialogTitle>
            </DialogHeader>
            {selectedRoom && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{selectedRoom.challengeTitle}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <Label className="text-slate-400">Student</Label>
                    <p className="text-white">{selectedRoom.studentName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Corporate</Label>
                    <p className="text-white">{selectedRoom.corporateName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Escrow Amount</Label>
                    <p className="text-emerald-400 font-semibold">₹{selectedRoom.escrowAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Escrow Status</Label>
                    <Badge variant="outline" className={selectedRoom.escrowStatus === 'held' ? 'text-yellow-400 border-yellow-600' : selectedRoom.escrowStatus === 'released' ? 'text-green-400 border-green-600' : 'text-red-400 border-red-600'}>
                      {selectedRoom.escrowStatus}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Room Status</Label>
                    <Badge variant="outline" className={selectedRoom.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-slate-600/20 text-slate-400 border-slate-600/30'}>
                      {selectedRoom.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400">Created</Label>
                    <p className="text-white">{format(new Date(selectedRoom.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                {/* Escrow Action Buttons */}
                {selectedRoom.escrowStatus === 'held' && (
                  <div className="flex gap-2 pt-4 border-t border-slate-700">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleEscrowAction(selectedRoom.id, 'release');
                        setSelectedRoom(null);
                      }}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" /> Release to Student
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600/20"
                      onClick={() => {
                        handleEscrowAction(selectedRoom.id, 'refund');
                        setSelectedRoom(null);
                      }}
                    >
                      <AlertTriangle className="mr-1 h-4 w-4" /> Mark Disputed
                    </Button>
                  </div>
                )}

                {/* Messages Section */}
                {selectedRoom.messages && selectedRoom.messages.length > 0 && (
                  <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Chat Messages ({selectedRoom.messages.length})</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 bg-slate-800/50 rounded-lg p-3">
                      {selectedRoom.messages.map((msg: any, idx: number) => (
                        <div key={msg.id || idx} className={`p-2 rounded ${msg.senderRole === 'corporate' ? 'bg-blue-900/30' : 'bg-emerald-900/30'}`}>
                          <div className="flex justify-between text-xs text-slate-400">
                            <span className="font-medium">{msg.senderName}</span>
                            <span>{msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, HH:mm') : ''}</span>
                          </div>
                          <p className="text-white text-sm mt-1">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

// Mock data for fellowship challenges
function getMockChallenges(): Challenge[] {
  return [
    {
      id: 'demo-1',
      title: 'Design a Modern Logo for TechStart',
      description: 'Looking for a modern logo...',
      price: 5000,
      status: 'open',
      corporateId: 'corp-1',
      corporateName: 'Raj Kumar',
      companyName: 'TechStart India',
      category: 'design',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      requirements: [],
      proposalCount: 12,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'demo-2',
      title: 'Write SEO Blog Posts',
      description: 'Need blog posts...',
      price: 8000,
      status: 'in_progress',
      corporateId: 'corp-2',
      corporateName: 'Priya Sharma',
      companyName: 'LearnHub',
      category: 'content',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      requirements: [],
      proposalCount: 8,
      selectedProposalId: 'prop-1',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'demo-3',
      title: 'Build React Dashboard',
      description: 'Analytics dashboard...',
      price: 15000,
      status: 'completed',
      corporateId: 'corp-3',
      corporateName: 'Amit Patel',
      companyName: 'DataViz Solutions',
      category: 'development',
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      requirements: [],
      proposalCount: 5,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  ];
}

// Mock data for project rooms
function getMockRooms(): ProjectRoom[] {
  return [
    {
      id: 'room-1',
      challengeId: 'demo-2',
      challengeTitle: 'Write SEO Blog Posts',
      studentId: 'student-1',
      studentName: 'Priya Sharma',
      corporateId: 'corp-2',
      corporateName: 'LearnHub',
      escrowStatus: 'held',
      escrowAmount: 8000,
      status: 'active',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'room-2',
      challengeId: 'demo-3',
      challengeTitle: 'Build React Dashboard',
      studentId: 'student-2',
      studentName: 'Rahul Verma',
      corporateId: 'corp-3',
      corporateName: 'DataViz Solutions',
      escrowStatus: 'released',
      escrowAmount: 15000,
      status: 'completed',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];
}
