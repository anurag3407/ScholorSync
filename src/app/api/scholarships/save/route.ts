import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateUser } from '@/lib/firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, userId, scholarshipId, action } = body as {
      uid?: string;
      userId?: string;
      scholarshipId: string;
      action: 'save' | 'unsave';
    };

    const userIdToUse = uid || userId;

    if (!userIdToUse) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!scholarshipId) {
      return NextResponse.json(
        { success: false, error: 'Scholarship ID is required' },
        { status: 400 }
      );
    }

    // Get current user data
    const user = await getUser(userIdToUse);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const savedScholarships = user.savedScholarships || [];
    let updatedSavedScholarships: string[];

    if (action === 'save') {
      // Add scholarship if not already saved
      if (!savedScholarships.includes(scholarshipId)) {
        updatedSavedScholarships = [...savedScholarships, scholarshipId];
      } else {
        updatedSavedScholarships = savedScholarships;
      }
    } else if (action === 'unsave') {
      // Remove scholarship from saved list
      updatedSavedScholarships = savedScholarships.filter(
        (id) => id !== scholarshipId
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "save" or "unsave"' },
        { status: 400 }
      );
    }

    // Update user document
    await updateUser(userIdToUse, {
      savedScholarships: updatedSavedScholarships,
    });

    return NextResponse.json({
      success: true,
      message: `Scholarship ${action}d successfully`,
      savedScholarships: updatedSavedScholarships,
    });
  } catch (error) {
    console.error('Error saving/unsaving scholarship:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update saved scholarships' },
      { status: 500 }
    );
  }
}
