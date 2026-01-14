import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdmin(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

// GET - Fetch admin dashboard statistics
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

    // Fetch all collections data
    const [usersSnapshot, scholarshipsSnapshot, notificationsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'scholarships')),
      getDocs(collection(db, 'notifications')),
    ]);

    // Calculate user statistics
    let totalApplications = 0;
    let appliedCount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let totalSavedScholarships = 0;
    let totalDocuments = 0;

    const usersByMonth: Record<string, number> = {};
    const applicationsByMonth: Record<string, number> = {};

    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const appliedScholarships = data.appliedScholarships || [];

      totalApplications += appliedScholarships.length;
      totalSavedScholarships += (data.savedScholarships || []).length;
      totalDocuments += Object.keys(data.documents || {}).length;

      appliedScholarships.forEach((app: any) => {
        switch (app.status) {
          case 'applied': appliedCount++; break;
          case 'pending': pendingCount++; break;
          case 'approved': approvedCount++; break;
          case 'rejected': rejectedCount++; break;
        }

        // Track applications by month
        const appliedDate = app.appliedOn?.toDate?.() || new Date(app.appliedOn);
        if (appliedDate) {
          const monthKey = `${appliedDate.getFullYear()}-${String(appliedDate.getMonth() + 1).padStart(2, '0')}`;
          applicationsByMonth[monthKey] = (applicationsByMonth[monthKey] || 0) + 1;
        }
      });

      // Track users by month
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      if (createdAt) {
        const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
      }
    });

    // Calculate scholarship statistics
    let adminScholarships = 0;
    let governmentScholarships = 0;
    let privateScholarships = 0;
    let collegeScholarships = 0;
    let expiredScholarships = 0;
    let totalScholarshipAmount = 0;

    const now = new Date();
    scholarshipsSnapshot.docs.forEach(doc => {
      const data = doc.data();

      if (data.createdByAdmin) adminScholarships++;

      switch (data.type) {
        case 'government': governmentScholarships++; break;
        case 'private': privateScholarships++; break;
        case 'college': collegeScholarships++; break;
      }

      if (data.deadline && new Date(data.deadline) < now) {
        expiredScholarships++;
      }

      if (data.amount?.max) {
        totalScholarshipAmount += data.amount.max;
      }
    });

    // Notification statistics
    const unreadNotifications = notificationsSnapshot.docs.filter(doc => !doc.data().read).length;

    // Recent activity
    const recentUsers = usersSnapshot.docs
      .map(doc => ({
        id: doc.id,
        email: doc.data().email,
        name: doc.data().profile?.name,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers: usersSnapshot.size,
          totalScholarships: scholarshipsSnapshot.size,
          totalApplications,
          totalNotifications: notificationsSnapshot.size,
        },
        users: {
          total: usersSnapshot.size,
          totalSavedScholarships,
          totalDocuments,
          byMonth: usersByMonth,
          recent: recentUsers,
        },
        scholarships: {
          total: scholarshipsSnapshot.size,
          adminCreated: adminScholarships,
          government: governmentScholarships,
          private: privateScholarships,
          college: collegeScholarships,
          expired: expiredScholarships,
          totalAmount: totalScholarshipAmount,
        },
        applications: {
          total: totalApplications,
          applied: appliedCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          byMonth: applicationsByMonth,
          approvalRate: totalApplications > 0
            ? ((approvedCount / totalApplications) * 100).toFixed(2)
            : '0',
        },
        notifications: {
          total: notificationsSnapshot.size,
          unread: unreadNotifications,
        },
      }
    });
  } catch (error) {
    console.error('Admin Stats GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
