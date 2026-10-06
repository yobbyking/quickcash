import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase-admin';

/**
 * Login endpoint — verifies the Firebase ID token and returns the user.
 * Same flow as register but doesn't create a new user.
 *
 * If the Firebase user exists but our DB record doesn't (edge case where
 * they signed up via Firebase but registration didn't complete), return
 * an error telling them to complete registration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });

    const decoded = await verifyIdToken(body.idToken);
    if (!decoded || !decoded.uid) {
      return NextResponse.json({ error: 'Invalid Firebase token' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { firebaseUid: decoded.uid } });
    if (!user) {
      return NextResponse.json({ error: 'Account not found. Please register first.', needsRegister: true }, { status: 404 });
    }
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account suspended. Contact support.' }, { status: 403 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      tier: user.tier,
      isActivated: user.isActivated,
      balance: user.balance,
      totalEarned: user.totalEarned,
      tasksCompleted: user.tasksCompleted,
      referralCode: user.referralCode,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAdmin: user.isAdmin,
    });
  } catch (err) {
    console.error('[login] error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
