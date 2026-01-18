'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Search,
  Award,
  Loader2,
  Plus,
  ArrowRight,
  X
} from 'lucide-react';
import Link from 'next/link';

interface SuccessStory {
  id: string;
  authorName: string;
  avatar: string;
  scholarship: string;
  amount: string;
  tips: string;
  likes: number;
  comments: number;
  createdAt: string;
}

interface Discussion {
  id: string;
  title: string;
  content?: string;
  authorName?: string;
  author?: string;
  avatar: string;
  category?: string;
  replies: number;
  views: number;
  tags: string[];
  createdAt: string;
}

const DISCUSSION_CATEGORIES = [
  { value: 'general', label: 'General Discussion' },
  { value: 'scholarship-help', label: 'Scholarship Help' },
  { value: 'application-tips', label: 'Application Tips' },
  { value: 'documents', label: 'Document Queries' },
];

const POPULAR_TAGS = [
  'SOP', 'Merit', 'NSP', 'State', 'Central', 'Engineering',
  'Medical', 'Documents', 'Deadline', 'Income', 'Timeline'
];

export default function CommunityPage() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileComplete, setProfileComplete] = useState(false);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  // Story submission modal state
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyForm, setStoryForm] = useState({
    scholarship: '',
    amount: '',
    tips: ''
  });
  const [storySubmitting, setStorySubmitting] = useState(false);

  // Discussion submission modal state
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [discussionForm, setDiscussionForm] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[]
  });
  const [discussionSubmitting, setDiscussionSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router, isConfigured]);

  // Fetch success stories from API
  const fetchStories = async () => {
    try {
      const response = await fetch('/api/community/stories');
      if (response.ok) {
        const data = await response.json();
        setSuccessStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  // Fetch discussions from API
  const fetchDiscussions = async () => {
    try {
      const response = await fetch('/api/community/discussions');
      if (response.ok) {
        const data = await response.json();
        setDiscussions(data.discussions || []);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchStories();
    fetchDiscussions();
  }, []);

  // Handle story form submission
  const handleStorySubmit = async () => {
    if (!user) return;

    if (!storyForm.scholarship || !storyForm.amount || !storyForm.tips) {
      return;
    }

    setStorySubmitting(true);
    try {
      const userName = user.profile?.name || user.email?.split('@')[0] || 'Anonymous';
      const response = await fetch('/api/community/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: userName,
          userAvatar: userName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U',
          scholarship: storyForm.scholarship,
          amount: storyForm.amount,
          tips: storyForm.tips
        })
      });

      if (response.ok) {
        setIsStoryModalOpen(false);
        setStoryForm({ scholarship: '', amount: '', tips: '' });
        fetchStories();
      }
    } catch (error) {
      console.error('Error submitting story:', error);
    } finally {
      setStorySubmitting(false);
    }
  };

  // Handle discussion form submission
  const handleDiscussionSubmit = async () => {
    if (!user) return;

    if (!discussionForm.title || !discussionForm.content) {
      return;
    }

    setDiscussionSubmitting(true);
    try {
      const userName = user.profile?.name || user.email?.split('@')[0] || 'Anonymous';
      const response = await fetch('/api/community/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: userName,
          userAvatar: userName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U',
          title: discussionForm.title,
          content: discussionForm.content,
          category: discussionForm.category,
          tags: discussionForm.tags
        })
      });

      if (response.ok) {
        setIsDiscussionModalOpen(false);
        setDiscussionForm({ title: '', content: '', category: 'general', tags: [] });
        fetchDiscussions();
      }
    } catch (error) {
      console.error('Error submitting discussion:', error);
    } finally {
      setDiscussionSubmitting(false);
    }
  };

  // Tag management for discussions
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !discussionForm.tags.includes(trimmedTag) && discussionForm.tags.length < 5) {
      setDiscussionForm(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDiscussionForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const response = await fetch(`/api/profile?uid=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setProfileComplete(data.profile?.isComplete || false);
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
            Community Intelligence
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Learn from successful applicants and share your experiences
          </p>
        </div>
      </div>

      {/* Profile Incomplete Alert */}
      {!profileComplete && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Complete Your Profile</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Complete your profile to participate in community discussions.
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-950">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Community Members</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-950">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Success Stories</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{successStories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-950">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Discussions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{discussions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search discussions, success stories..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stories" className="gap-2">
            <Award className="h-4 w-4" />
            Success Stories
          </TabsTrigger>
          <TabsTrigger value="discussions" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Discussions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Success Stories</CardTitle>
                  <CardDescription>
                    Learn from students who successfully received scholarships
                  </CardDescription>
                </div>
                {profileComplete && (
                  <Button className="gap-2" onClick={() => setIsStoryModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Share Your Story
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {successStories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Award className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300">
                    No success stories yet
                  </h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-md">
                    Be the first to share your scholarship success story and help others!
                  </p>
                  {profileComplete && (
                    <Button className="mt-4 gap-2" onClick={() => setIsStoryModalOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Share Your Story
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {successStories.map((story) => (
                    <div
                      key={story.id}
                      className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{story.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {story.authorName}
                            </h4>
                            <Badge variant="secondary" className="text-green-700 bg-green-100">
                              {story.scholarship}
                            </Badge>
                          </div>
                          <p className="text-sm text-green-600 font-medium mt-1">
                            Received {story.amount}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 mt-2">
                            {story.tips}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
                              <ThumbsUp className="h-4 w-4" />
                              {story.likes}
                            </button>
                            <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
                              <MessageSquare className="h-4 w-4" />
                              {story.comments}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discussions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Discussions</CardTitle>
                  <CardDescription>
                    Ask questions and get help from the community
                  </CardDescription>
                </div>
                {profileComplete && (
                  <Button className="gap-2" onClick={() => setIsDiscussionModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Start Discussion
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {discussions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300">
                    No discussions yet
                  </h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-md">
                    Start a discussion to get help from the community or share your knowledge.
                  </p>
                  {profileComplete && (
                    <Button className="mt-4 gap-2" onClick={() => setIsDiscussionModalOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Start Discussion
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {discussions.map((discussion) => (
                    <div
                      key={discussion.id}
                      className="rounded-lg border border-slate-200 p-4 hover:border-blue-200 cursor-pointer dark:border-slate-700 dark:hover:border-blue-900 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{discussion.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white hover:text-blue-600">
                            {discussion.title}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">
                            by {discussion.authorName || discussion.author}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-slate-500">
                              {discussion.replies} replies
                            </span>
                            <span className="text-sm text-slate-500">
                              {discussion.views} views
                            </span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {discussion.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isStoryModalOpen} onOpenChange={setIsStoryModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Share Your Success Story
            </DialogTitle>
            <DialogDescription>
              Inspire fellow students by sharing your scholarship journey and tips.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="story-scholarship">Scholarship Name *</Label>
              <Input
                id="story-scholarship"
                placeholder="e.g., INSPIRE SHE, AICTE Pragati"
                value={storyForm.scholarship}
                onChange={(e) => setStoryForm(prev => ({ ...prev, scholarship: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="story-amount">Amount Received *</Label>
              <Input
                id="story-amount"
                placeholder="e.g., ₹50,000/year"
                value={storyForm.amount}
                onChange={(e) => setStoryForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="story-tips">Your Tips & Advice *</Label>
              <Textarea
                id="story-tips"
                placeholder="Share what helped you succeed - application tips, documents needed, timeline advice..."
                className="min-h-[120px]"
                value={storyForm.tips}
                onChange={(e) => setStoryForm(prev => ({ ...prev, tips: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStoryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStorySubmit}
              disabled={storySubmitting || !storyForm.scholarship || !storyForm.amount || !storyForm.tips}
            >
              {storySubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                'Share Story'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discussion Submission Modal */}
      <Dialog open={isDiscussionModalOpen} onOpenChange={setIsDiscussionModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Start a Discussion
            </DialogTitle>
            <DialogDescription>
              Ask questions or share knowledge with the community.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discussion-title">Title *</Label>
              <Input
                id="discussion-title"
                placeholder="e.g., How to write a winning SOP?"
                value={discussionForm.title}
                onChange={(e) => setDiscussionForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discussion-category">Category</Label>
              <Select
                value={discussionForm.category}
                onValueChange={(value) => setDiscussionForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {DISCUSSION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discussion-content">Description *</Label>
              <Textarea
                id="discussion-content"
                placeholder="Describe your question or topic in detail..."
                className="min-h-[100px]"
                value={discussionForm.content}
                onChange={(e) => setDiscussionForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags <span className="text-slate-400 font-normal">(optional, up to 5)</span></Label>

              {/* Selected Tags */}
              {discussionForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {discussionForm.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-slate-900">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tag Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  disabled={discussionForm.tags.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tagInput)}
                  disabled={!tagInput.trim() || discussionForm.tags.length >= 5}
                >
                  Add
                </Button>
              </div>

              {/* Popular Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_TAGS.filter(tag => !discussionForm.tags.includes(tag)).slice(0, 6).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={discussionForm.tags.length >= 5}
                    className="px-2 py-0.5 text-xs rounded border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscussionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDiscussionSubmit}
              disabled={discussionSubmitting || !discussionForm.title || !discussionForm.content}
            >
              {discussionSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Discussion'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
