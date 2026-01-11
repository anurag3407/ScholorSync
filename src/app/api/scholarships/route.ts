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

    // Sort scholarships to show admin-created ones first
    const sortedScholarships = scholarships.sort((a: any, b: any) => {
      // Admin priority scholarships come first
      if (a.adminPriority && !b.adminPriority) return -1;
      if (!a.adminPriority && b.adminPriority) return 1;
      
      // Then sort by createdByAdmin
      if (a.createdByAdmin && !b.createdByAdmin) return -1;
      if (!a.createdByAdmin && b.createdByAdmin) return 1;
      
      // Then sort by deadline
      const dateA = new Date(a.deadline || '2099-12-31').getTime();
      const dateB = new Date(b.deadline || '2099-12-31').getTime();
      return dateA - dateB;
    });

    return NextResponse.json(sortedScholarships);
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scholarships' },
      { status: 500 }
    );
  }
}
