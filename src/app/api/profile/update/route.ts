import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/firebase/firestore';
import type { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, userId, profile } = body as {
      uid?: string;
      userId?: string;
      profile: Partial<UserProfile>;
    };

    const userIdToUse = uid || userId;

    if (!userIdToUse) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile data is required' },
        { status: 400 }
      );
    }

    await updateUserProfile(userIdToUse, profile);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
