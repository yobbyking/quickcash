/**
 * lib/firebase-admin.ts — Firebase Admin SDK for server-side token verification.
 *
 * The client sends the Firebase ID token in the Authorization header.
 * We verify it server-side to get the firebaseUid, then look up our User.
 *
 * Required env vars (set in Vercel — DON'T expose to client):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  (with \\n replaced by newlines)
 *
 * Get these from: Firebase Console → Project Settings → Service Accounts → "Generate new private key"
 */

import admin from 'firebase-admin';

let initialized = false;

function init() {
  if (initialized) return admin;
  if (admin.apps.length > 0) {
    initialized = true;
    return admin;
  }
  // Service account credentials from env vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  initialized = true;
  return admin;
}

/**
 * Verify a Firebase ID token and return the decoded user.
 * Returns null if invalid or expired.
 */
export async function verifyIdToken(idToken: string) {
  try {
    init();
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    console.error('[firebase-admin] token verify failed:', err.message || err);
    return null;
  }
}

export default admin;
