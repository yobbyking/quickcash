/**
 * lib/firebase.ts — Firebase client SDK initialization.
 *
 * Used for Google sign-in + email/password auth on the client side.
 * The client config is safe to expose (Firebase client keys are public).
 *
 * Service account credentials for server-side verification are in
 * lib/firebase-admin.ts (via env vars FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 * FIREBASE_PRIVATE_KEY).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase project: xtechstk
const firebaseConfig = {
  apiKey: "AIzaSyC8gzrjsiN9XirOJUpisQEx267d3FSoe3U",
  authDomain: "xtechstk.firebaseapp.com",
  projectId: "xtechstk",
  storageBucket: "xtechstk.firebasestorage.app",
  messagingSenderId: "107867078074",
  appId: "1:107867078074:web:8b5b708274fba22e3a7183",
  measurementId: "G-45MPVJD5CG",
};

// Initialize once (avoid double-init on HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Force account selection prompt every time (better UX for switching accounts)
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
