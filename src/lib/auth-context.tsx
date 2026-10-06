'use client';

/**
 * AuthContext — client-side auth state using Firebase + our backend.
 *
 * Flow:
 * 1. User signs in via Firebase (Google popup or email/password)
 * 2. We get the Firebase ID token
 * 3. We POST it to /api/auth/login — if user exists, returns our user
 * 4. If user doesn't exist (404), we POST to /api/auth/register with extra fields
 *
 * The provider stores:
 *   - firebaseUser (raw Firebase user)
 *   - appUser (our DB user with tier, balance, etc.) — null until registration complete
 *   - loading (true during initial load)
 *   - error (last error message)
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export interface AppUser {
  id: string;
  email: string;
  username: string;
  phone: string;
  tier: string;
  isActivated: boolean;
  balance: number;
  totalEarned: number;
  tasksCompleted: number;
  todayEarned?: number;
  referralCode: string;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  needsRegistration: boolean;  // true if Firebase user exists but our DB record doesn't
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  completeRegistration: (data: { username: string; phone: string; tier: string; referralCode?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  // Subscribe to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setIdToken(token);
          // Try login first
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token }),
          });
          if (res.ok) {
            const data = await res.json();
            setAppUser(data);
            setNeedsRegistration(false);
          } else if (res.status === 404) {
            // Need to complete registration
            setNeedsRegistration(true);
            setAppUser(null);
          } else {
            const data = await res.json().catch(() => ({}));
            setError(data.error || 'Login failed');
          }
        } catch (err) {
          setError(err.message || 'Network error');
        }
      } else {
        setAppUser(null);
        setIdToken(null);
        setNeedsRegistration(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function fetchAppUser(token: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    if (res.ok) {
      const data = await res.json();
      setAppUser(data);
      setNeedsRegistration(false);
    } else if (res.status === 404) {
      setNeedsRegistration(true);
      setAppUser(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed');
    }
  }

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      setIdToken(token);
      await fetchAppUser(token);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      setIdToken(token);
      await fetchAppUser(token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      setIdToken(token);
      // After signup, Firebase user exists but our DB record doesn't yet
      setNeedsRegistration(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    }
  };

  const completeRegistration = async (data: { username: string; phone: string; tier: string; referralCode?: string }) => {
    setError(null);
    if (!idToken) {
      setError('Not signed in with Firebase');
      return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, ...data }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Registration failed');
        return;
      }
      setAppUser(result);
      setNeedsRegistration(false);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(true);  // force refresh
      setIdToken(token);
      await fetchAppUser(token);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setAppUser(null);
    setIdToken(null);
    setNeedsRegistration(false);
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser, appUser, loading, error, needsRegistration,
      signInWithGoogle, signInWithEmail, signUpWithEmail,
      completeRegistration, refreshUser, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
