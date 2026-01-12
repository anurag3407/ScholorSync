import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  // Note: Newer Firebase projects use 'firebasestorage.app' domain
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
};

// Check if Firebase is properly configured
export const isFirebaseConfigured =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'demo-api-key';

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create mock objects for development without Firebase
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

export { auth, db, storage };
export default app;
