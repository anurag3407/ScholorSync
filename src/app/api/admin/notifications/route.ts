import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
  getDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdmin(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

// GET - Fetch all notifications (optionally by user)
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
    const userId = searchParams.get('userId');

    const notificationsRef = collection(db, 'notifications');
    let notificationsSnapshot;

    if (userId) {
      const q = query(notificationsRef, where('userId', '==', userId));
      notificationsSnapshot = await getDocs(q);
    } else {
      notificationsSnapshot = await getDocs(notificationsRef);
    }

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));

    // Sort by date (newest first)
    notifications.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: notifications,
      total: notifications.length
    });
  } catch (error) {
    console.error('Admin Notifications GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Send notification to user(s)
export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { adminEmail, adminPassword, userIds, notification } = body;

    if (!verifyAdmin(adminEmail, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!notification || !notification.title || !notification.message) {
      return NextResponse.json({ error: 'Notification title and message are required' }, { status: 400 });
    }

    const targetUserIds = userIds || [];

    // If no specific users, send to all users
    let recipients = targetUserIds;
    if (recipients.length === 0) {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      recipients = usersSnapshot.docs.map(doc => doc.id);
    }

    const notificationsRef = collection(db, 'notifications');
    let sentCount = 0;

    for (const userId of recipients) {
      try {
        const notificationRef = doc(notificationsRef);
        await setDoc(notificationRef, {
          userId,
          type: notification.type || 'tip',
          title: notification.title,
          message: notification.message,
          scholarshipId: notification.scholarshipId || null,
          read: false,
          createdAt: Timestamp.now(),
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send notification to user ${userId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${sentCount} user(s)`,
      sentCount
    });
  } catch (error) {
    console.error('Admin Notifications POST Error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const adminEmail = request.headers.get('x-admin-email');
    const adminPassword = request.headers.get('x-admin-password');

    if (!verifyAdmin(adminEmail || '', adminPassword || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (notificationId) {
      // Delete single notification
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      return NextResponse.json({ success: true, message: 'Notification deleted' });
    }

    if (userId) {
      // Delete all notifications for a user
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      let deletedCount = 0;
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'notifications', docSnap.id));
        deletedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} notifications for user`
      });
    }

    return NextResponse.json({ error: 'Notification ID or User ID required' }, { status: 400 });
  } catch (error) {
    console.error('Admin Notifications DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
