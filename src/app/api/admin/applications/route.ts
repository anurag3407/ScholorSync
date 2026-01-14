import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdmin(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

// GET - Fetch all applications
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
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const scholarshipId = searchParams.get('scholarshipId');

    // Fetch all users and their applications
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const allApplications: any[] = [];

    for (const userDoc of usersSnapshot.docs) {
      // Filter by userId if provided
      if (userId && userDoc.id !== userId) continue;

      const userData = userDoc.data();
      const appliedScholarships = userData.appliedScholarships || [];

      for (const app of appliedScholarships) {
        // Filter by scholarshipId if provided
        if (scholarshipId && app.id !== scholarshipId) continue;

        // Filter by status if provided
        if (status && app.status !== status) continue;

        // Get scholarship details
        const scholarshipRef = doc(db, 'scholarships', app.id);
        const scholarshipSnap = await getDoc(scholarshipRef);
        const scholarshipData = scholarshipSnap.exists() ? scholarshipSnap.data() : null;

        allApplications.push({
          id: `${userDoc.id}_${app.id}`,
          odoo: userDoc.id,
          userName: userData.profile?.name || 'Unknown',
          userEmail: userData.email || 'Unknown',
          userProfile: userData.profile || {},
          scholarshipId: app.id,
          scholarshipName: scholarshipData?.name || 'Unknown Scholarship',
          scholarshipProvider: scholarshipData?.provider || 'Unknown',
          scholarshipAmount: scholarshipData?.amount || { min: 0, max: 0 },
          status: app.status,
          appliedOn: app.appliedOn?.toDate?.() || app.appliedOn || new Date(),
          statusUpdatedAt: app.statusUpdatedAt?.toDate?.() || app.statusUpdatedAt || null,
        });
      }
    }

    // Sort by applied date (most recent first)
    allApplications.sort((a, b) =>
      new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()
    );

    return NextResponse.json({
      success: true,
      data: allApplications,
      total: allApplications.length,
      stats: {
        applied: allApplications.filter(a => a.status === 'applied').length,
        pending: allApplications.filter(a => a.status === 'pending').length,
        approved: allApplications.filter(a => a.status === 'approved').length,
        rejected: allApplications.filter(a => a.status === 'rejected').length,
      }
    });
  } catch (error) {
    console.error('Admin Applications GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// PUT - Update application status
export async function PUT(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { adminEmail, adminPassword, userId, scholarshipId, newStatus, notes } = body;

    if (!verifyAdmin(adminEmail, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId || !scholarshipId || !newStatus) {
      return NextResponse.json({ error: 'userId, scholarshipId, and newStatus are required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['applied', 'pending', 'approved', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status. Must be one of: applied, pending, approved, rejected' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const appliedScholarships = userData.appliedScholarships || [];

    // Find and update the application
    let applicationFound = false;
    const updatedApplications = appliedScholarships.map((app: any) => {
      if (app.id === scholarshipId) {
        applicationFound = true;
        return {
          ...app,
          status: newStatus,
          statusUpdatedAt: Timestamp.now(),
          adminNotes: notes || app.adminNotes,
        };
      }
      return app;
    });

    if (!applicationFound) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    await updateDoc(userRef, {
      appliedScholarships: updatedApplications,
      updatedAt: Timestamp.now(),
    });

    // Get scholarship name for notification
    const scholarshipRef = doc(db, 'scholarships', scholarshipId);
    const scholarshipSnap = await getDoc(scholarshipRef);
    const scholarshipName = scholarshipSnap.exists() ? scholarshipSnap.data().name : 'a scholarship';

    // Create notification for user
    const notificationsRef = collection(db, 'notifications');
    const notificationRef = doc(notificationsRef);

    let notificationMessage = '';
    switch (newStatus) {
      case 'pending':
        notificationMessage = `Your application for "${scholarshipName}" is now under review.`;
        break;
      case 'approved':
        notificationMessage = `Congratulations! Your application for "${scholarshipName}" has been approved!`;
        break;
      case 'rejected':
        notificationMessage = `We regret to inform you that your application for "${scholarshipName}" was not successful.`;
        break;
      default:
        notificationMessage = `Your application status for "${scholarshipName}" has been updated to: ${newStatus}`;
    }

    await setDoc(notificationRef, {
      userId,
      type: 'application_update',
      title: 'Application Status Updated',
      message: notificationMessage,
      scholarshipId,
      read: false,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Application status updated to ${newStatus}`
    });
  } catch (error) {
    console.error('Admin Applications PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
  }
}

// POST - Bulk update application statuses
export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { adminEmail, adminPassword, applications } = body;

    if (!verifyAdmin(adminEmail, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!applications || !Array.isArray(applications) || applications.length === 0) {
      return NextResponse.json({ error: 'Applications array is required' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const app of applications) {
      try {
        const { userId, scholarshipId, newStatus } = app;

        if (!userId || !scholarshipId || !newStatus) {
          results.failed++;
          results.errors.push(`Missing required fields for application`);
          continue;
        }

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          results.failed++;
          results.errors.push(`User ${userId} not found`);
          continue;
        }

        const userData = userSnap.data();
        const appliedScholarships = userData.appliedScholarships || [];

        const updatedApplications = appliedScholarships.map((a: any) => {
          if (a.id === scholarshipId) {
            return {
              ...a,
              status: newStatus,
              statusUpdatedAt: Timestamp.now(),
            };
          }
          return a;
        });

        await updateDoc(userRef, {
          appliedScholarships: updatedApplications,
          updatedAt: Timestamp.now(),
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Error updating application: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk update completed: ${results.success} succeeded, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Admin Applications POST Error:', error);
    return NextResponse.json({ error: 'Failed to perform bulk update' }, { status: 500 });
  }
}
