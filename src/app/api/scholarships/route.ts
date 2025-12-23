import { NextRequest, NextResponse } from 'next/server';
import { getAllScholarships, getScholarshipsByType } from '@/lib/firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'government' | 'private' | 'college' | null;

    let scholarships;

    if (type) {
      scholarships = await getScholarshipsByType(type);
    } else {
      scholarships = await getAllScholarships();
    }

    return NextResponse.json(scholarships);
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scholarships' },
      { status: 500 }
    );
  }
}
