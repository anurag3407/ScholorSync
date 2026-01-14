'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  DollarSign,
  ExternalLink,
  Info,
  Sparkles,
  Target,
  TrendingUp,
  Building2,
  Users,
  Loader2,
} from 'lucide-react';
import type { ScholarshipMatch, EligibilityExplanation } from '@/types';
import { format } from 'date-fns';

interface ScholarshipCardProps {
  scholarship: ScholarshipMatch;
  isSaved?: boolean;
  onSave?: (id: string) => void;
  onUnsave?: (id: string) => void;
  onExplain?: (scholarship: ScholarshipMatch) => Promise<EligibilityExplanation>;
  onApply?: (scholarship: ScholarshipMatch) => void; // For in-app applications (admin scholarships)
}

export function ScholarshipCard({
  scholarship,
  isSaved = false,
  onSave,
  onUnsave,
  onExplain,
  onApply,
}: ScholarshipCardProps) {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<EligibilityExplanation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExplain = async () => {
    if (explanation || !onExplain) return;
    setIsExplaining(true);
    try {
      const result = await onExplain(scholarship);
      setExplanation(result);
    } catch (error) {
      console.error('Failed to get explanation:', error);
    } finally {
      setIsExplaining(false);
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'government':
        return 'bg-blue-100 text-blue-800';
      case 'private':
        return 'bg-purple-100 text-purple-800';
      case 'college':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const deadlineDate = new Date(scholarship.deadline);
  const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={getTypeColor(scholarship.type)}>
                {scholarship.type.charAt(0).toUpperCase() + scholarship.type.slice(1)}
              </Badge>
              {daysLeft <= 7 && daysLeft > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {daysLeft} days left!
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold leading-tight">{scholarship.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {scholarship.provider}
            </p>
          </div>
          <div
            className={`flex flex-col items-center justify-center rounded-full h-16 w-16 ${getMatchBgColor(
              scholarship.matchPercentage
            )}`}
          >
            <span className={`text-lg font-bold ${getMatchColor(scholarship.matchPercentage)}`}>
              {scholarship.matchPercentage}%
            </span>
            <span className="text-xs text-muted-foreground">Match</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium">
            ₹{scholarship.amount.min.toLocaleString()} - ₹{scholarship.amount.max.toLocaleString()}
          </span>
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-orange-600" />
          <span>Deadline: {format(deadlineDate, 'MMM d, yyyy')}</span>
        </div>

        {/* Match Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Eligibility Match</span>
            <span className={`font-medium ${getMatchColor(scholarship.matchPercentage)}`}>
              {scholarship.matchPercentage}%
            </span>
          </div>
          <Progress value={scholarship.matchPercentage} className="h-2" />
        </div>

        {/* Match Reasons */}
        {scholarship.matchReasons && scholarship.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scholarship.matchReasons.slice(0, 3).map((reason, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                ✓ {reason}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-4 border-t">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleExplain}
            >
              {isExplaining ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              AI Explain
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Eligibility Analysis
              </DialogTitle>
              <DialogDescription>{scholarship.name}</DialogDescription>
            </DialogHeader>
            {isExplaining ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : explanation ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${explanation.eligible ? 'bg-green-50' : 'bg-red-50'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target
                      className={`h-5 w-5 ${explanation.eligible ? 'text-green-600' : 'text-red-600'
                        }`}
                    />
                    <span className="font-semibold">
                      {explanation.eligible ? 'You qualify!' : 'Not fully eligible'}
                    </span>
                    <Badge variant="secondary" className="ml-auto">
                      {explanation.matchPercentage}% Match
                    </Badge>
                  </div>
                  <p className="text-sm">{explanation.explanation}</p>
                </div>

                {explanation.meetsCriteria.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Criteria You Meet
                    </h4>
                    <ul className="space-y-1">
                      {explanation.meetsCriteria.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <span className="text-green-600">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.missedCriteria.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Info className="h-4 w-4 text-red-600" />
                      Missing Criteria
                    </h4>
                    <ul className="space-y-1">
                      {explanation.missedCriteria.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <span className="text-red-600">✗</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.suggestions.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      Suggestions
                    </h4>
                    <ul className="space-y-1">
                      {explanation.suggestions.map((item, idx) => (
                        <li key={idx} className="text-sm text-blue-800">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Click to analyze your eligibility
              </p>
            )}
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => (isSaved ? onUnsave?.(scholarship.id) : onSave?.(scholarship.id))}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </Button>

        {/* Show in-app Apply for admin scholarships (no applicationUrl) or external link for scraped */}
        {scholarship.applicationUrl ? (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => window.open(scholarship.applicationUrl, '_blank', 'noopener,noreferrer')}
          >
            Apply Now
            <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => onApply?.(scholarship)}
          >
            Apply Here
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
