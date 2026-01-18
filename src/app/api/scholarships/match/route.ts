import { NextRequest, NextResponse } from 'next/server';
import { getAllScholarships, getUser } from '@/lib/firebase/firestore';
import { querySimilarScholarships } from '@/lib/pinecone/client';
import { generateProfileEmbedding } from '@/lib/langchain/chains';
import type { ScholarshipMatch, UserProfile, Scholarship } from '@/types';

// Calculate match percentage based on eligibility criteria
function calculateMatchPercentage(profile: UserProfile, scholarship: Scholarship): {
  percentage: number;
  matchReasons: string[];
  missingCriteria: string[];
} {
  const matchReasons: string[] = [];
  const missingCriteria: string[] = [];
  let score = 0;
  let maxScore = 0;

  // Safety check for eligibility object
  const eligibility = scholarship.eligibility || {};
  const categories = eligibility.categories || [];
  const states = eligibility.states || [];
  const incomeLimit = eligibility.incomeLimit || 0;
  const minPercentage = eligibility.minPercentage || 0;
  const gender = eligibility.gender || 'all';
  const yearRange = eligibility.yearRange || [1, 6];

  // Category match (25 points)
  maxScore += 25;
  if (
    categories.length === 0 ||
    categories.includes('all') ||
    categories.includes(profile.category)
  ) {
    score += 25;
    matchReasons.push(`Category: ${profile.category}`);
  } else {
    missingCriteria.push(`Requires: ${categories.join(', ')}`);
  }

  // Income check (20 points)
  maxScore += 20;
  if (incomeLimit === 0 || profile.income <= incomeLimit) {
    score += 20;
    matchReasons.push('Income within limit');
  } else {
    missingCriteria.push(`Income exceeds ₹${incomeLimit.toLocaleString()}`);
  }

  // Percentage check (20 points)
  maxScore += 20;
  if (profile.percentage >= minPercentage) {
    score += 20;
    matchReasons.push(`Academic: ${profile.percentage}%`);
  } else {
    missingCriteria.push(`Requires ${minPercentage}% marks`);
  }

  // State match (15 points)
  maxScore += 15;
  if (
    states.length === 0 ||
    states.includes('all') ||
    states.includes(profile.state)
  ) {
    score += 15;
    matchReasons.push(`State: ${profile.state}`);
  } else {
    missingCriteria.push(`Available in: ${states.join(', ')}`);
  }

  // Branch/Course match (10 points)
  maxScore += 10;
  const branches = eligibility.branches || [];
  if (
    branches.length === 0 ||
    branches.includes('all') ||
    branches.some((b: string) =>
      profile.branch?.toLowerCase().includes(b.toLowerCase())
    )
  ) {
    score += 10;
    matchReasons.push(`Branch: ${profile.branch}`);
  } else {
    missingCriteria.push(`For branches: ${branches.join(', ')}`);
  }

  // Gender match (5 points)
  maxScore += 5;
  if (
    gender === 'all' ||
    gender === profile.gender
  ) {
    score += 5;
  } else {
    missingCriteria.push(`Only for ${gender}`);
  }

  // Year match (5 points)
  maxScore += 5;
  const [minYear, maxYear] = yearRange;
  if (profile.year >= minYear && profile.year <= maxYear) {
    score += 5;
    matchReasons.push(`Year ${profile.year}`);
  } else {
    missingCriteria.push(`For Year ${minYear}-${maxYear} students`);
  }

  const percentage = Math.round((score / maxScore) * 100);
  return { percentage, matchReasons, missingCriteria };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, userId, useVectorSearch } = body as {
      uid?: string;
      userId?: string;
      useVectorSearch?: boolean;
    };

    const userIdToUse = uid || userId;

    if (!userIdToUse) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const user = await getUser(userIdToUse);
    if (!user || !user.profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    let scholarships: Scholarship[];

    if (useVectorSearch) {
      // Use vector search for semantic matching
      try {
        const profileEmbedding = await generateProfileEmbedding(user.profile);
        const vectorResults = await querySimilarScholarships(profileEmbedding, 20);

        // Get full scholarship data for matched IDs
        const allScholarships = await getAllScholarships();
        const matchedIds = new Set(vectorResults.map((r) => r.id));
        scholarships = allScholarships.filter((s) => matchedIds.has(s.id));
      } catch (error) {
        console.error('Vector search failed, falling back to all scholarships:', error);
        scholarships = await getAllScholarships();
      }
    } else {
      // Get all scholarships and filter by basic criteria
      scholarships = await getAllScholarships();
    }

    // Pre-filter scholarships based on strict eligibility criteria
    const eligibleScholarships = scholarships.filter((scholarship) => {
      const eligibility = scholarship.eligibility || {};
      const categories = eligibility.categories || [];
      const states = eligibility.states || [];
      const incomeLimit = eligibility.incomeLimit || 0;
      const gender = eligibility.gender || 'all';
      const yearRange = eligibility.yearRange || [1, 6];

      // Strict income check - if income limit is set and user exceeds it, exclude
      if (incomeLimit > 0 && user.profile.income > incomeLimit) {
        return false;
      }

      // Strict category check - if categories specified and user not in list, exclude
      if (categories.length > 0 &&
        !categories.includes('all') &&
        !categories.includes(user.profile.category)) {
        return false;
      }

      // Strict state check - if states specified and user not in list, exclude
      if (states.length > 0 &&
        !states.includes('all') &&
        !states.includes('All States') &&
        !states.includes(user.profile.state)) {
        return false;
      }

      // Strict gender check
      if (gender !== 'all' && gender !== user.profile.gender) {
        return false;
      }

      // Strict year check
      const [minYear, maxYear] = yearRange;
      if (user.profile.year < minYear || user.profile.year > maxYear) {
        return false;
      }

      return true;
    });

    // Calculate match percentages for eligible scholarships only
    const matchedScholarships: ScholarshipMatch[] = eligibleScholarships.map((scholarship) => {
      const { percentage, matchReasons, missingCriteria } = calculateMatchPercentage(
        user.profile,
        scholarship
      );
      return {
        ...scholarship,
        matchPercentage: percentage,
        matchReasons,
        missingCriteria,
      };
    });

    // Filter to only include scholarships with meaningful match (≥40%)
    const filteredScholarships = matchedScholarships.filter(s => s.matchPercentage >= 40);

    // Sort by match percentage
    filteredScholarships.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json({
      success: true,
      scholarships: filteredScholarships,
      totalInDatabase: scholarships.length,
      eligibleCount: eligibleScholarships.length,
      count: filteredScholarships.length,
    });
  } catch (error) {
    console.error('Error matching scholarships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to match scholarships' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const useVectorSearch = searchParams.get('vectorSearch') === 'true';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const user = await getUser(userId);
    if (!user || !user.profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    let scholarships: Scholarship[];

    if (useVectorSearch) {
      // Use vector search for semantic matching
      const profileEmbedding = await generateProfileEmbedding(user.profile);
      const vectorResults = await querySimilarScholarships(profileEmbedding, 20);

      // Get full scholarship data for matched IDs
      const allScholarships = await getAllScholarships();
      const matchedIds = new Set(vectorResults.map((r) => r.id));
      scholarships = allScholarships.filter((s) => matchedIds.has(s.id));
    } else {
      // Get all scholarships and filter by basic criteria
      scholarships = await getAllScholarships();
    }

    // Pre-filter scholarships based on strict eligibility criteria
    const eligibleScholarships = scholarships.filter((scholarship) => {
      const eligibility = scholarship.eligibility || {};
      const categories = eligibility.categories || [];
      const states = eligibility.states || [];
      const incomeLimit = eligibility.incomeLimit || 0;
      const gender = eligibility.gender || 'all';
      const yearRange = eligibility.yearRange || [1, 6];

      // Strict income check
      if (incomeLimit > 0 && user.profile.income > incomeLimit) {
        return false;
      }

      // Strict category check
      if (categories.length > 0 &&
        !categories.includes('all') &&
        !categories.includes(user.profile.category)) {
        return false;
      }

      // Strict state check
      if (states.length > 0 &&
        !states.includes('all') &&
        !states.includes('All States') &&
        !states.includes(user.profile.state)) {
        return false;
      }

      // Strict gender check
      if (gender !== 'all' && gender !== user.profile.gender) {
        return false;
      }

      // Strict year check
      const [minYear, maxYear] = yearRange;
      if (user.profile.year < minYear || user.profile.year > maxYear) {
        return false;
      }

      return true;
    });

    // Calculate match percentages for eligible scholarships only
    const matchedScholarships: ScholarshipMatch[] = eligibleScholarships.map((scholarship) => {
      const { percentage, matchReasons, missingCriteria } = calculateMatchPercentage(
        user.profile,
        scholarship
      );
      return {
        ...scholarship,
        matchPercentage: percentage,
        matchReasons,
        missingCriteria,
      };
    });

    // Filter to only include scholarships with meaningful match (≥40%)
    const filteredScholarships = matchedScholarships.filter(s => s.matchPercentage >= 40);

    // Sort by match percentage
    filteredScholarships.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json({
      success: true,
      data: filteredScholarships,
      totalInDatabase: scholarships.length,
      eligibleCount: eligibleScholarships.length,
      count: filteredScholarships.length,
    });
  } catch (error) {
    console.error('Error matching scholarships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to match scholarships' },
      { status: 500 }
    );
  }
}
