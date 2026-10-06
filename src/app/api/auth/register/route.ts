import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyIdToken } from '@/lib/firebase-admin';
import { generateReferralCode, TIERS } from '@/lib/auth';
import { generateCode, sendVerificationEmail } from '@/lib/email';
import { z } from 'zod';

const RegisterSchema = z.object({
  idToken: z.string(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, underscores'),
  phone: z.string().min(10).max(15),
  tier: z.enum(['silver', 'gold', 'vip']).default('silver'),
  referralCode: z.string().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { idToken, username, phone, tier, referralCode, displayName, photoURL } = parsed.data;

    const decoded = await verifyIdToken(idToken);
    if (!decoded || !decoded.uid || !decoded.email) {
      return NextResponse.json({ error: 'Invalid Firebase token' }, { status: 401 });
    }

    const email = decoded.email.toLowerCase();
    const firebaseUid = decoded.uid;

    // Check uniqueness
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { firebaseUid },
          { email },
          { username: username.toLowerCase() },
          { phone },
        ],
      },
    });
    if (existing) {
      if (existing.firebaseUid === firebaseUid) return NextResponse.json({ error: 'Account already exists. Please log in.' }, { status: 409 });
      if (existing.email === email) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      if (existing.username === username.toLowerCase()) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      if (existing.phone === phone) return NextResponse.json({ error: 'Phone already registered' }, { status: 409 });
    }

    // Resolve referral
    let referredById: string | null = null;
    if (referralCode) {
      const ref = await db.user.findUnique({ where: { referralCode: referralCode.toUpperCase() } });
      if (!ref) return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
      referredById = ref.id;
    }

    const code = generateReferralCode(username);

    // Generate a 6-digit email verification code (expires in 10 min)
    const verificationCode = generateCode();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await db.user.create({
      data: {
        firebaseUid,
        email,
        username: username.toLowerCase(),
        phone,
        displayName: displayName || decoded.name || username,
        photoURL: photoURL || decoded.picture || null,
        tier,
        isActivated: false,
        isEmailVerified: false,
        verificationCode,
        verificationCodeExpiresAt: codeExpiresAt,
        referralCode: code,
        referredById,
      },
    });

    // Send verification email (async, don't block registration)
    sendVerificationEmail(email, verificationCode, user.username)
      .then(r => {
        if (r.success) console.log(`[register] verification email sent to ${email}`);
        else console.warn(`[register] email send failed for ${email}:`, r.error);
      })
      .catch(err => console.error('[register] email send error:', err));

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      tier: user.tier,
      isActivated: user.isActivated,
      isEmailVerified: user.isEmailVerified,
      balance: user.balance,
      referralCode: user.referralCode,
      displayName: user.displayName,
      photoURL: user.photoURL,
      message: 'Account created. Check your email for a 6-digit verification code.',
    });
  } catch (err) {
    console.error('[register] error:', err);
    return NextResponse.json({ error: 'Registration failed: ' + (err.message || err) }, { status: 500 });
  }
}
