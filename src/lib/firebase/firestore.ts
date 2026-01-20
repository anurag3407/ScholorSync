import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  CollectionReference,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { User, Scholarship, FeeStructure, CommunityTip, Notification } from '@/types';

// Helper to get collection reference safely
const getCollectionRef = (name: string): CollectionReference => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured. Please check your Firebase settings.');
  }
  return collection(db, name);
};

// Helper to convert Firestore data
const convertTimestamps = <T extends DocumentData>(data: T): T => {
  const result = { ...data } as Record<string, unknown>;
  for (const key in result) {
    const value = result[key];
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
  }
  return result as T;
};

// User operations
export const createUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  const usersCollection = getCollectionRef('users');
  const userRef = doc(usersCollection, userId);
  await setDoc(userRef, {
    ...userData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const getUser = async (userId: string): Promise<User | null> => {
  const usersCollection = getCollectionRef('users');
  const userRef = doc(usersCollection, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return convertTimestamps({ id: userSnap.id, ...data }) as unknown as User;
  }
  return null;
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  const usersCollection = getCollectionRef('users');
  const userRef = doc(usersCollection, userId);
  await updateDoc(userRef, {
    ...userData,
    updatedAt: Timestamp.now(),
  });
};

export const updateUserProfile = async (
  userId: string,
  profile: Partial<User['profile']>
): Promise<void> => {
  const usersCollection = getCollectionRef('users');
  const userRef = doc(usersCollection, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const currentProfile = userSnap.data().profile || {};
    await updateDoc(userRef, {
      profile: { ...currentProfile, ...profile },
      updatedAt: Timestamp.now(),
    });
  }
};

// Scholarship operations
export const getScholarship = async (scholarshipId: string): Promise<Scholarship | null> => {
  const scholarshipsCollection = getCollectionRef('scholarships');
  const scholarshipRef = doc(scholarshipsCollection, scholarshipId);
  const scholarshipSnap = await getDoc(scholarshipRef);
  if (scholarshipSnap.exists()) {
    const data = scholarshipSnap.data();
    return convertTimestamps({ id: scholarshipSnap.id, ...data }) as Scholarship;
  }
  return null;
};

export const getAllScholarships = async (): Promise<Scholarship[]> => {
  const scholarshipsCollection = getCollectionRef('scholarships');
  const q = query(scholarshipsCollection, orderBy('deadline', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return convertTimestamps({ id: docSnap.id, ...data }) as Scholarship;
  });
};

export const getScholarshipsByType = async (
  type: 'government' | 'private' | 'college'
): Promise<Scholarship[]> => {
  const scholarshipsCollection = getCollectionRef('scholarships');
  const q = query(
    scholarshipsCollection,
    where('type', '==', type),
    orderBy('deadline', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return convertTimestamps({ id: docSnap.id, ...data }) as Scholarship;
  });
};

export const createScholarship = async (
  scholarship: Omit<Scholarship, 'id'>
): Promise<string> => {
  const scholarshipsCollection = getCollectionRef('scholarships');
  const scholarshipRef = doc(scholarshipsCollection);
  await setDoc(scholarshipRef, {
    ...scholarship,
    scrapedAt: Timestamp.now(),
  });
  return scholarshipRef.id;
};

export const updateScholarship = async (
  scholarshipId: string,
  data: Partial<Scholarship>
): Promise<void> => {
  const scholarshipsCollection = getCollectionRef('scholarships');
  const scholarshipRef = doc(scholarshipsCollection, scholarshipId);
  await updateDoc(scholarshipRef, data);
};

// Fee Structure operations
export const getFeeStructure = async (collegeId: string): Promise<FeeStructure | null> => {
  const feeStructuresCollection = getCollectionRef('feeStructures');
  const feeRef = doc(feeStructuresCollection, collegeId);
  const feeSnap = await getDoc(feeRef);
  if (feeSnap.exists()) {
    const data = feeSnap.data();
    return convertTimestamps({ id: feeSnap.id, ...data }) as FeeStructure;
  }
  return null;
};

export const getFeeStructureByCollegeName = async (
  collegeName: string
): Promise<FeeStructure | null> => {
  const feeStructuresCollection = getCollectionRef('feeStructures');
  const q = query(feeStructuresCollection, where('collegeName', '==', collegeName), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    return convertTimestamps({ id: docSnap.id, ...data }) as FeeStructure;
  }
  return null;
};

export const createFeeStructure = async (
  feeStructure: Omit<FeeStructure, 'id'>
): Promise<string> => {
  const feeStructuresCollection = getCollectionRef('feeStructures');
  const feeRef = doc(feeStructuresCollection);
  await setDoc(feeRef, {
    ...feeStructure,
    lastUpdated: Timestamp.now(),
  });
  return feeRef.id;
};

// Community Tips operations
export const getCommunityTips = async (scholarshipId: string): Promise<CommunityTip[]> => {
  const communityTipsCollection = getCollectionRef('communityTips');
  const q = query(
    communityTipsCollection,
    where('scholarshipId', '==', scholarshipId),
    orderBy('upvotes', 'desc'),
    limit(10)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return convertTimestamps({ id: docSnap.id, ...data }) as CommunityTip;
  });
};

export const createCommunityTip = async (
  tip: Omit<CommunityTip, 'id' | 'createdAt' | 'upvotes' | 'verified'>
): Promise<string> => {
  const communityTipsCollection = getCollectionRef('communityTips');
  const tipRef = doc(communityTipsCollection);
  await setDoc(tipRef, {
    ...tip,
    createdAt: Timestamp.now(),
    upvotes: 0,
    verified: false,
  });
  return tipRef.id;
};

// Notifications operations
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const notificationsCollection = getCollectionRef('notifications');
  const q = query(
    notificationsCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return convertTimestamps({ id: docSnap.id, ...data }) as Notification;
  });
};

export const createNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<string> => {
  const notificationsCollection = getCollectionRef('notifications');
  const notificationRef = doc(notificationsCollection);
  await setDoc(notificationRef, {
    ...notification,
    createdAt: Timestamp.now(),
    read: false,
  });
  return notificationRef.id;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationsCollection = getCollectionRef('notifications');
  const notificationRef = doc(notificationsCollection, notificationId);
  await updateDoc(notificationRef, { read: true });
};

// Save/Unsave Scholarship
export const saveScholarship = async (userId: string, scholarshipId: string): Promise<void> => {
  const usersCollection = getCollectionRef('users');
  const userRef = doc(usersCollection, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const savedScholarships = userSnap.data().savedScholarships || [];
    if (!savedScholarships.includes(scholarshipId)) {
      await updateDoc(userRef, {
        savedScholarships: [...savedScholarships, scholarshipId],
        updatedAt: Timestamp.now(),
      });
    }
  }
};

export const unsaveScholarship = async (userId: string, scholarshipId: string): Promise<void> => {
  const usersCollection = getCollectionRef('users');
  const userRef = doc(usersCollection, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const savedScholarships = userSnap.data().savedScholarships || [];
    await updateDoc(userRef, {
      savedScholarships: savedScholarships.filter((id: string) => id !== scholarshipId),
      updatedAt: Timestamp.now(),
    });
  }
};

// Apply for Scholarship
export const applyForScholarship = async (
  userId: string,
  scholarshipId: string,
  source: 'scholarship_card' | 'chatbot' | 'direct' = 'direct'
): Promise<void> => {
  const usersCollection = getCollectionRef('users');
  const userRef = doc(usersCollection, userId);
  const userSnap = await getDoc(userRef);

  const newApplication = {
    id: scholarshipId,
    status: 'applied',
    appliedOn: Timestamp.now(),
    source,
  };

  if (userSnap.exists()) {
    const appliedScholarships = userSnap.data().appliedScholarships || [];
    const alreadyApplied = appliedScholarships.some(
      (app: { id: string }) => app.id === scholarshipId
    );
    if (!alreadyApplied) {
      await updateDoc(userRef, {
        appliedScholarships: [...appliedScholarships, newApplication],
        updatedAt: Timestamp.now(),
      });
    }
  } else {
    // Create user document if it doesn't exist
    await setDoc(userRef, {
      appliedScholarships: [newApplication],
      savedScholarships: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
};

// Update Application Status (for users to update their own applications)
export const updateApplicationStatus = async (
  userId: string,
  scholarshipId: string,
  newStatus: 'applied' | 'pending' | 'approved' | 'rejected' | 'document_review',
  notes?: string
): Promise<void> => {
  const usersCollection = getCollectionRef('users');
  const userRef = doc(usersCollection, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const appliedScholarships = userSnap.data().appliedScholarships || [];
    const updatedScholarships = appliedScholarships.map(
      (app: { id: string; status: string; notes?: string }) => {
        if (app.id === scholarshipId) {
          return {
            ...app,
            status: newStatus,
            statusUpdatedAt: Timestamp.now(),
            ...(notes !== undefined && { notes }),
          };
        }
        return app;
      }
    );
    await updateDoc(userRef, {
      appliedScholarships: updatedScholarships,
      updatedAt: Timestamp.now(),
    });
  }
};
