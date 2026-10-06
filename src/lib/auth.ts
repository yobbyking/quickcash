/**
 * lib/auth.ts — server-side auth helper.
 *
 * Verifies Firebase ID tokens from the Authorization header
 * and looks up the matching User in our Postgres DB.
 */

import { db } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export async function getUserFromRequest(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const idToken = authHeader.slice(7);

    const decoded = await verifyIdToken(idToken);
    if (!decoded || !decoded.uid) return null;

    // Find user by firebaseUid
    const user = await db.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });
    return user;
  } catch (err) {
    console.error('[auth] getUserFromRequest error:', err.message || err);
    return null;
  }
}

/**
 * Helper for server actions / route handlers that use the new headers() API.
 */
export async function getCurrentUser() {
  try {
    const h = await headers();
    const authHeader = h.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const idToken = authHeader.slice(7);
    const decoded = await verifyIdToken(idToken);
    if (!decoded || !decoded.uid) return null;
    return await db.user.findUnique({ where: { firebaseUid: decoded.uid } });
  } catch (err) {
    return null;
  }
}

export function generateReferralCode(seed?: string) {
  const base = (seed || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return (base + rand).slice(0, 8) || rand;
}

export const TIERS = {
  silver: { name: 'Silver', activationFee: 199, minPayout: 30, maxPayout: 80 },
  gold:   { name: 'Gold',   activationFee: 299, minPayout: 100, maxPayout: 250 },
  vip:   { name: 'VIP',    activationFee: 399, minPayout: 300, maxPayout: 800 },
} as const;

export type TierKey = keyof typeof TIERS;
