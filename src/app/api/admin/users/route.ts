import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdmin(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

// GET - Fetch all users
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
    const userId = searchParams.get('id');

    // Get single user
    if (userId) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userData = userSnap.data();
      return NextResponse.json({
        success: true,
        data: {
          id: userSnap.id,
          ...userData,
          createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
          updatedAt: userData.updatedAt?.toDate?.() || userData.updatedAt,
        }
      });
    }

    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        profile: data.profile || {},
        savedScholarshipsCount: (data.savedScholarships || []).length,
        appliedScholarshipsCount: (data.appliedScholarships || []).length,
        documentsCount: Object.keys(data.documents || {}).length,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('Admin Users GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PUT - Update user (admin can update user profiles)
export async function PUT(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { adminEmail, adminPassword, userId, updates } = body;

    if (!verifyAdmin(adminEmail, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow certain fields to be updated by admin
    const allowedUpdates: any = {};
    if (updates.profile) allowedUpdates.profile = updates.profile;
    if (updates.notifications !== undefined) allowedUpdates.notifications = updates.notifications;

    await updateDoc(userRef, {
      ...allowedUpdates,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Admin Users PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user (use with caution)
export async function DELETE(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const adminEmail = request.headers.get('x-admin-email');
    const adminPassword = request.headers.get('x-admin-password');

    if (!verifyAdmin(adminEmail || '', adminPassword || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user's notifications
    const notificationsRef = collection(db, 'notifications');
    const notificationsSnapshot = await getDocs(notificationsRef);
    for (const notifDoc of notificationsSnapshot.docs) {
      if (notifDoc.data().userId === userId) {
        await deleteDoc(doc(db, 'notifications', notifDoc.id));
      }
    }

    // Delete user document
    await deleteDoc(userRef);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin Users DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
