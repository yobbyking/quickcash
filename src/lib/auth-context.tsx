'use client';

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
  isEmailVerified: boolean;
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
  needsRegistration: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  completeRegistration: (data: { username: string; phone: string; tier: string; displayName?: string; referralCode?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Firebase error code → human-readable message
function firebaseErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address format',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email. Please register first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
    'auth/email-already-in-use': 'An account with this email already exists. Please log in.',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled',
    'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups and try again.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Contact support.',
  };
  return map[code] || code.replace('auth/', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setIdToken(token);
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
        } catch (err: any) {
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
      return data;
    } else if (res.status === 404) {
      setNeedsRegistration(true);
      setAppUser(null);
      throw new Error('NEEDS_REGISTRATION');
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Login failed');
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
      const msg = err.code ? firebaseErrorMessage(err.code) : (err.message || 'Google sign-in failed');
      setError(msg);
      throw new Error(msg);
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
      const msg = err.code ? firebaseErrorMessage(err.code) : (err.message || 'Login failed');
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      setIdToken(token);
      setNeedsRegistration(true);
      return result;
    } catch (err: any) {
      const msg = err.code ? firebaseErrorMessage(err.code) : (err.message || 'Sign up failed');
      setError(msg);
      throw new Error(msg);
    }
  };

  const completeRegistration = async (data: { username: string; phone: string; tier: string; displayName?: string; referralCode?: string }) => {
    setError(null);
    if (!idToken) {
      setError('Not signed in. Please refresh and try again.');
      throw new Error('Not signed in');
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
        throw new Error(result.error || 'Registration failed');
      }
      setAppUser(result);
      setNeedsRegistration(false);
      return result;
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(true);
      setIdToken(token);
      try {
        await fetchAppUser(token);
      } catch {}
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
