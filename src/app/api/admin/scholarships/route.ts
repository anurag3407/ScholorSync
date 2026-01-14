import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdmin(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const adminEmail = request.headers.get('x-admin-email');
    const adminPassword = request.headers.get('x-admin-password');

    if (!verifyAdmin(adminEmail || '', adminPassword || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const adminOnly = searchParams.get('adminOnly') === 'true';

    // Get single scholarship
    if (id) {
      const scholarshipRef = doc(db, 'scholarships', id);
      const scholarshipSnap = await getDoc(scholarshipRef);

      if (!scholarshipSnap.exists()) {
        return NextResponse.json({ error: 'Scholarship not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: { id: scholarshipSnap.id, ...scholarshipSnap.data() }
      });
    }

    // Get scholarships by type or all
    const scholarshipsRef = collection(db, 'scholarships');
    let q;

    if (adminOnly) {
      q = query(scholarshipsRef, where('createdByAdmin', '==', true), orderBy('createdAt', 'desc'));
    } else if (type) {
      q = query(scholarshipsRef, where('type', '==', type), orderBy('deadline', 'asc'));
    } else {
      q = query(scholarshipsRef, orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const scholarships = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scrapedAt: doc.data().scrapedAt?.toDate?.() || doc.data().scrapedAt,
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));

    return NextResponse.json({ success: true, data: scholarships });
  } catch (error) {
    console.error('Admin Scholarships GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch scholarships' }, { status: 500 });
  }
}

// POST - Create new scholarship
export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { adminEmail, adminPassword, ...scholarshipData } = body;

    if (!verifyAdmin(adminEmail, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!scholarshipData.name || !scholarshipData.provider) {
      return NextResponse.json({ error: 'Name and provider are required' }, { status: 400 });
    }

    const scholarshipsRef = collection(db, 'scholarships');
    const newScholarshipRef = doc(scholarshipsRef);

    const scholarship = {
      id: newScholarshipRef.id,
      name: scholarshipData.name,
      provider: scholarshipData.provider,
      type: scholarshipData.type || 'private',
      amount: {
        min: scholarshipData.amount?.min || 0,
        max: scholarshipData.amount?.max || 0,
      },
      eligibility: {
        categories: scholarshipData.eligibility?.categories || [],
        incomeLimit: scholarshipData.eligibility?.incomeLimit || 0,
        minPercentage: scholarshipData.eligibility?.minPercentage || 0,
        states: scholarshipData.eligibility?.states || [],
        branches: scholarshipData.eligibility?.branches || [],
        gender: scholarshipData.eligibility?.gender || 'all',
        yearRange: scholarshipData.eligibility?.yearRange || [1, 4],
      },
      eligibilityText: scholarshipData.eligibilityText || '',
      description: scholarshipData.description || '',
      deadline: scholarshipData.deadline || '',
      applicationUrl: '', // Empty for admin scholarships - users apply through the app
      documentsRequired: scholarshipData.documentsRequired || [],
      sourceUrl: '', // No external source for admin-created scholarships
      createdByAdmin: true,
      adminPriority: true,
      scrapedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    await setDoc(newScholarshipRef, scholarship);

    return NextResponse.json({
      success: true,
      message: 'Scholarship created successfully',
      data: scholarship
    }, { status: 201 });
  } catch (error) {
    console.error('Admin Scholarships POST Error:', error);
    return NextResponse.json({ error: 'Failed to create scholarship' }, { status: 500 });
  }
}

// PUT - Update scholarship
export async function PUT(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { adminEmail, adminPassword, scholarshipId, ...updates } = body;

    if (!verifyAdmin(adminEmail, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!scholarshipId) {
      return NextResponse.json({ error: 'Scholarship ID required' }, { status: 400 });
    }

    const scholarshipRef = doc(db, 'scholarships', scholarshipId);
    const scholarshipSnap = await getDoc(scholarshipRef);

    if (!scholarshipSnap.exists()) {
      return NextResponse.json({ error: 'Scholarship not found' }, { status: 404 });
    }

    await updateDoc(scholarshipRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Scholarship updated successfully'
    });
  } catch (error) {
    console.error('Admin Scholarships PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update scholarship' }, { status: 500 });
  }
}

// DELETE - Delete scholarship
export async function DELETE(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const scholarshipId = searchParams.get('id');
    const adminEmail = request.headers.get('x-admin-email');
    const adminPassword = request.headers.get('x-admin-password');

    if (!verifyAdmin(adminEmail || '', adminPassword || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!scholarshipId) {
      return NextResponse.json({ error: 'Scholarship ID required' }, { status: 400 });
    }

    const scholarshipRef = doc(db, 'scholarships', scholarshipId);
    const scholarshipSnap = await getDoc(scholarshipRef);

    if (!scholarshipSnap.exists()) {
      return NextResponse.json({ error: 'Scholarship not found' }, { status: 404 });
    }

    await deleteDoc(scholarshipRef);

    return NextResponse.json({
      success: true,
      message: 'Scholarship deleted successfully'
    });
  } catch (error) {
    console.error('Admin Scholarships DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete scholarship' }, { status: 500 });
  }
}
