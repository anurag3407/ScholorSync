'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase/config';
import { createUser, getUser } from '@/lib/firebase/firestore';
import type { User, UserProfile } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  isAdmin: boolean;
  adminCredentials: { email: string; password: string } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to parse Firebase auth errors into user-friendly messages
function getAuthErrorMessage(error: AuthError): string {
  const errorCode = error.code;
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Please use localhost for development.';
    case 'auth/invalid-api-key':
      return 'Invalid Firebase API key. Please check your configuration.';
    case 'auth/app-deleted':
      return 'Firebase app has been deleted.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email but different sign-in credentials.';
    default:
      console.error('Firebase Auth Error:', errorCode, error.message);
      return error.message || 'An authentication error occurred.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState<{ email: string; password: string } | null>(null);

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser, createIfMissing = false) => {
    if (!isFirebaseConfigured) return;
    try {
      const userData = await getUser(firebaseUser.uid);
      if (!userData && createIfMissing) {
        // Create user document if it doesn't exist
        await createUser(firebaseUser.uid, {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          profile: {
            name: firebaseUser.displayName || '',
            category: 'General',
            income: 0,
            percentage: 0,
            branch: '',
            year: 1,
            state: '',
            college: '',
            gender: 'Male',
            achievements: [],
          },
          documents: {},
          savedScholarships: [],
          appliedScholarships: [],
          notifications: true,
        });
        // Fetch again after creating
        const newUserData = await getUser(firebaseUser.uid);
        setUser(newUserData);
      } else {
        setUser(userData);
      }
    } catch (err) {
      // Check if it's a Firestore permission error
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        console.error('Firestore Permission Error: Please update Firestore Security Rules in Firebase Console');
        setError('Database access denied. Please configure Firestore security rules. See console for details.');
      } else {
        console.error('Error fetching user data:', err);
      }
      // Still set a minimal user object so the app can function
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        profile: {
          name: firebaseUser.displayName || '',
          category: 'General',
          income: 0,
          percentage: 0,
          branch: '',
          year: 1,
          state: '',
          college: '',
          gender: 'Male',
          achievements: [],
        },
        documents: {},
        savedScholarships: [],
        appliedScholarships: [],
        notifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Listen for auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      console.error('Firebase Auth is not properly initialized');
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    // Check for admin login via API
    try {
      const adminResponse = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const adminResult = await adminResponse.json();

      if (adminResult.success && adminResult.data?.isAdmin) {
        setIsAdmin(true);
        setAdminCredentials({ email, password });
        setUser({
          uid: 'admin',
          email: email,
          profile: {
            name: 'Administrator',
            category: 'General',
            income: 0,
            percentage: 0,
            branch: '',
            year: 1,
            state: '',
            college: '',
            gender: 'Male',
            achievements: [],
          },
          documents: {},
          savedScholarships: [],
          appliedScholarships: [],
          notifications: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      // Not an admin login attempt, continue with regular Firebase auth
      console.log('Not an admin login, trying Firebase auth');
    }

    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please check your environment variables.');
      return;
    }

    setError(null);
    setIsAdmin(false);
    setAdminCredentials(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(result.user);
    } catch (err) {
      const errorMessage = err instanceof Error && 'code' in err
        ? getAuthErrorMessage(err as AuthError)
        : 'Failed to sign in';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, profile: Partial<UserProfile>) => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please check your environment variables.');
      return;
    }

    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Create user document in Firestore
      await createUser(result.user.uid, {
        uid: result.user.uid,
        email: result.user.email || email,
        profile: {
          name: profile.name || '',
          category: profile.category || 'General',
          income: profile.income || 0,
          percentage: profile.percentage || 0,
          branch: profile.branch || '',
          year: profile.year || 1,
          state: profile.state || '',
          college: profile.college || '',
          gender: profile.gender || 'Male',
          achievements: profile.achievements || [],
        },
        documents: {},
        savedScholarships: [],
        appliedScholarships: [],
        notifications: true,
      });

      await fetchUserData(result.user);
    } catch (err) {
      const errorMessage = err instanceof Error && 'code' in err
        ? getAuthErrorMessage(err as AuthError)
        : 'Failed to create account';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please check your environment variables.');
      return;
    }

    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);

      // Try to check if user exists and create if not
      // Handle permission errors gracefully
      try {
        const existingUser = await getUser(result.user.uid);

        if (!existingUser) {
          // Create new user document
          await createUser(result.user.uid, {
            uid: result.user.uid,
            email: result.user.email || '',
            profile: {
              name: result.user.displayName || '',
              category: 'General',
              income: 0,
              percentage: 0,
              branch: '',
              year: 1,
              state: '',
              college: '',
              gender: 'Male',
              achievements: [],
            },
            documents: {},
            savedScholarships: [],
            appliedScholarships: [],
            notifications: true,
          });
        }

        await fetchUserData(result.user);
      } catch (firestoreError) {
        // Firestore error (likely permissions) - still let user sign in
        console.error('Firestore error during Google sign-in:', firestoreError);
        console.warn('Please configure Firestore security rules. See SETUP.md for instructions.');
        // Create a minimal user state from Firebase auth data
        await fetchUserData(result.user, false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error && 'code' in err
        ? getAuthErrorMessage(err as AuthError)
        : 'Failed to sign in with Google';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout
  const logout = async () => {
    setError(null);
    try {
      // Handle admin logout
      if (isAdmin) {
        setIsAdmin(false);
        setAdminCredentials(null);
        setUser(null);
        return;
      }
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
      setError(errorMessage);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please check your environment variables.');
      return;
    }

    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const errorMessage = err instanceof Error && 'code' in err
        ? getAuthErrorMessage(err as AuthError)
        : 'Failed to send reset email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser);
    }
  };

  const value = {
    firebaseUser,
    user,
    loading,
    error,
    isConfigured: Boolean(isFirebaseConfigured),
    isAdmin,
    adminCredentials,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
