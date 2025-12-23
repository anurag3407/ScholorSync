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

  // Category match (25 points)
  maxScore += 25;
  if (
    scholarship.eligibility.categories.includes('all') ||
    scholarship.eligibility.categories.includes(profile.category)
  ) {
    score += 25;
    matchReasons.push(`Category: ${profile.category}`);
  } else {
    missingCriteria.push(`Requires: ${scholarship.eligibility.categories.join(', ')}`);
  }

  // Income check (20 points)
  maxScore += 20;
  if (profile.income <= scholarship.eligibility.incomeLimit) {
    score += 20;
    matchReasons.push('Income within limit');
  } else {
    missingCriteria.push(`Income exceeds ₹${scholarship.eligibility.incomeLimit.toLocaleString()}`);
  }

  // Percentage check (20 points)
  maxScore += 20;
  if (profile.percentage >= scholarship.eligibility.minPercentage) {
    score += 20;
    matchReasons.push(`Academic: ${profile.percentage}%`);
  } else {
    missingCriteria.push(`Requires ${scholarship.eligibility.minPercentage}% marks`);
  }

  // State match (15 points)
  maxScore += 15;
  if (
    scholarship.eligibility.states.includes('all') ||
    scholarship.eligibility.states.includes(profile.state)
  ) {
    score += 15;
    matchReasons.push(`State: ${profile.state}`);
  } else {
    missingCriteria.push(`Available in: ${scholarship.eligibility.states.join(', ')}`);
  }

  // Branch match (10 points)
  maxScore += 10;
  if (
    scholarship.eligibility.branches.includes('all') ||
    scholarship.eligibility.branches.some((b) =>
      profile.branch.toLowerCase().includes(b.toLowerCase())
    )
  ) {
    score += 10;
    matchReasons.push(`Branch: ${profile.branch}`);
  } else {
    missingCriteria.push(`For branches: ${scholarship.eligibility.branches.join(', ')}`);
  }

  // Gender match (5 points)
  maxScore += 5;
  if (
    scholarship.eligibility.gender === 'all' ||
    scholarship.eligibility.gender === profile.gender
  ) {
    score += 5;
  } else {
    missingCriteria.push(`Only for ${scholarship.eligibility.gender}`);
  }

  // Year match (5 points)
  maxScore += 5;
  const [minYear, maxYear] = scholarship.eligibility.yearRange;
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

    // Calculate match percentages
    const matchedScholarships: ScholarshipMatch[] = scholarships.map((scholarship) => {
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

    // Sort by match percentage
    matchedScholarships.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json({
      success: true,
      scholarships: matchedScholarships,
      count: matchedScholarships.length,
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

    // Calculate match percentages
    const matchedScholarships: ScholarshipMatch[] = scholarships.map((scholarship) => {
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

    // Sort by match percentage
    matchedScholarships.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json({
      success: true,
      data: matchedScholarships,
      count: matchedScholarships.length,
    });
  } catch (error) {
    console.error('Error matching scholarships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to match scholarships' },
      { status: 500 }
    );
  }
}
