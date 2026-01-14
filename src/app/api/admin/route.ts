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
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Helper to verify admin
export function verifyAdmin(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

// GET - Fetch all scholarships (admin view) or all applications
export async function GET(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const adminEmail = request.headers.get('x-admin-email');
    const adminPassword = request.headers.get('x-admin-password');

    if (!verifyAdmin(adminEmail || '', adminPassword || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (type === 'applications') {
      // Fetch all users and their applications
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      const allApplications: any[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const appliedScholarships = userData.appliedScholarships || [];

        for (const app of appliedScholarships) {
          // Get scholarship details
          const scholarshipRef = doc(db, 'scholarships', app.id);
          const scholarshipSnap = await getDoc(scholarshipRef);
          const scholarshipData = scholarshipSnap.exists() ? scholarshipSnap.data() : null;

          allApplications.push({
            id: `${userDoc.id}_${app.id}`,
            odoo: userDoc.id,
            userName: userData.profile?.name || 'Unknown',
            userEmail: userData.email || 'Unknown',
            scholarshipId: app.id,
            scholarshipName: scholarshipData?.name || 'Unknown Scholarship',
            status: app.status,
            appliedOn: app.appliedOn?.toDate?.() || app.appliedOn || new Date(),
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: allApplications.sort((a, b) =>
          new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
        )
      });
    }

    if (type === 'users') {
      // Fetch all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      }));

      return NextResponse.json({ success: true, data: users });
    }

    if (type === 'stats') {
      // Fetch statistics
      const usersRef = collection(db, 'users');
      const scholarshipsRef = collection(db, 'scholarships');

      const [usersSnapshot, scholarshipsSnapshot] = await Promise.all([
        getDocs(usersRef),
        getDocs(scholarshipsRef),
      ]);

      let totalApplications = 0;
      let pendingApplications = 0;
      let approvedApplications = 0;
      let rejectedApplications = 0;

      usersSnapshot.docs.forEach(doc => {
        const appliedScholarships = doc.data().appliedScholarships || [];
        totalApplications += appliedScholarships.length;
        appliedScholarships.forEach((app: any) => {
          if (app.status === 'pending' || app.status === 'applied') pendingApplications++;
          else if (app.status === 'approved') approvedApplications++;
          else if (app.status === 'rejected') rejectedApplications++;
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          totalUsers: usersSnapshot.size,
          totalScholarships: scholarshipsSnapshot.size,
          adminScholarships: scholarshipsSnapshot.docs.filter(d => d.data().createdByAdmin).length,
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications,
        }
      });
    }

    // Default: Fetch all scholarships
    const scholarshipsRef = collection(db, 'scholarships');
    const q = query(scholarshipsRef, orderBy('scrapedAt', 'desc'));
    const snapshot = await getDocs(q);

    const scholarships = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scrapedAt: doc.data().scrapedAt?.toDate?.() || doc.data().scrapedAt,
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      deadline: doc.data().deadline,
    }));

    return NextResponse.json({ success: true, data: scholarships });
  } catch (error) {
    console.error('Admin GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Create a new scholarship
export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { adminEmail, adminPassword, scholarship } = body;

    if (!verifyAdmin(adminEmail, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!scholarship) {
      return NextResponse.json({ error: 'Scholarship data required' }, { status: 400 });
    }

    const scholarshipsRef = collection(db, 'scholarships');
    const newScholarshipRef = doc(scholarshipsRef);

    const scholarshipData = {
      ...scholarship,
      id: newScholarshipRef.id,
      createdByAdmin: true,
      adminPriority: true,
      scrapedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    await setDoc(newScholarshipRef, scholarshipData);

    return NextResponse.json({
      success: true,
      data: { id: newScholarshipRef.id, ...scholarshipData }
    });
  } catch (error) {
    console.error('Admin POST Error:', error);
    return NextResponse.json({ error: 'Failed to create scholarship' }, { status: 500 });
  }
}

// PUT - Update scholarship or application status
export async function PUT(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { adminEmail, adminPassword, type, data } = body;

    if (!verifyAdmin(adminEmail, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (type === 'application-status') {
      const { userId, scholarshipId, newStatus } = data;

      if (!userId || !scholarshipId || !newStatus) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userData = userSnap.data();
      const appliedScholarships = userData.appliedScholarships || [];

      const updatedApplications = appliedScholarships.map((app: any) => {
        if (app.id === scholarshipId) {
          return {
            ...app,
            status: newStatus,
            statusUpdatedAt: Timestamp.now(),
          };
        }
        return app;
      });

      await updateDoc(userRef, {
        appliedScholarships: updatedApplications,
        updatedAt: Timestamp.now(),
      });

      // Create notification for user
      const notificationsRef = collection(db, 'notifications');
      const notificationRef = doc(notificationsRef);
      await setDoc(notificationRef, {
        userId,
        type: 'application_update',
        title: 'Application Status Updated',
        message: `Your scholarship application status has been updated to: ${newStatus}`,
        scholarshipId,
        read: false,
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true, message: 'Application status updated' });
    }

    if (type === 'scholarship') {
      const { scholarshipId, updates } = data;

      if (!scholarshipId) {
        return NextResponse.json({ error: 'Scholarship ID required' }, { status: 400 });
      }

      const scholarshipRef = doc(db, 'scholarships', scholarshipId);
      await updateDoc(scholarshipRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true, message: 'Scholarship updated' });
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
  } catch (error) {
    console.error('Admin PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE - Delete a scholarship
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
    await deleteDoc(scholarshipRef);

    return NextResponse.json({ success: true, message: 'Scholarship deleted' });
  } catch (error) {
    console.error('Admin DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete scholarship' }, { status: 500 });
  }
}
