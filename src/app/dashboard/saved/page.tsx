"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bookmark, ExternalLink, Calendar, IndianRupee, X } from "lucide-react";
import { toast } from "sonner";
import { ScholarshipCard } from "@/components/scholarships/ScholarshipCard";
import type { Scholarship } from "@/types";

export default function SavedScholarshipsPage() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const router = useRouter();
  const [savedScholarships, setSavedScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router, isConfigured]);

  useEffect(() => {
    async function loadSavedScholarships() {
      if (!user) return;
      try {
        const response = await fetch(`/api/profile?uid=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          const savedIds = data.savedScholarships || user.savedScholarships || [];
          
          if (savedIds.length > 0) {
            // Fetch all scholarships and filter by saved IDs
            const scholarshipsResponse = await fetch('/api/scholarships');
            if (scholarshipsResponse.ok) {
              const allScholarships = await scholarshipsResponse.json();
              const saved = allScholarships.filter((s: Scholarship) => 
                savedIds.includes(s.id)
              );
              setSavedScholarships(saved);
            }
          }
        }
      } catch (error) {
        console.error("Error loading saved scholarships:", error);
        toast.error("Failed to load saved scholarships");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadSavedScholarships();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleUnsave = async (scholarshipId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/scholarships/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, scholarshipId, action: 'unsave' })
      });

      if (response.ok) {
        setSavedScholarships(prev => prev.filter(s => s.id !== scholarshipId));
        toast.success("Scholarship removed from saved");
      } else {
        toast.error("Failed to remove scholarship");
      }
    } catch (error) {
      console.error("Error removing scholarship:", error);
      toast.error("Failed to remove scholarship");
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Scholarships</h1>
          <p className="text-muted-foreground mt-2">
            Your bookmarked scholarships for quick access
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {savedScholarships.length} Saved
        </Badge>
      </div>

      {savedScholarships.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Saved Scholarships</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              You haven't saved any scholarships yet. Browse scholarships and click the bookmark icon to save them here.
            </p>
            <Button onClick={() => router.push("/dashboard/scholarships")}>
              Browse Scholarships
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedScholarships.map((scholarship) => (
            <Card key={scholarship.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {scholarship.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {scholarship.provider}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnsave(scholarship.id)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      ₹{scholarship.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{scholarship.type}</Badge>
                  {scholarship.eligibility.categories.slice(0, 2).map((cat, idx) => (
                    <Badge key={idx} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {scholarship.description || scholarship.eligibilityText}
                </p>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" asChild>
                    <a
                      href={scholarship.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apply Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
