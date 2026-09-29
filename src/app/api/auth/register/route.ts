import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, createSession, setSessionCookie, generateReferralCode } from '@/lib/auth';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, underscores'),
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { email, username, phone, password, referralCode } = parsed.data;

    const existing = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
          { phone },
        ],
      },
    });
    if (existing) {
      if (existing.email === email.toLowerCase()) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      if (existing.username === username.toLowerCase()) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      if (existing.phone === phone) return NextResponse.json({ error: 'Phone already registered' }, { status: 409 });
    }

    let referrerId: string | null = null;
    if (referralCode) {
      const ref = await db.user.findUnique({ where: { referralCode: referralCode.toUpperCase() } });
      if (!ref) return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
      referrerId = ref.id;
    }

    const code = generateReferralCode(username);
    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        phone,
        passwordHash,
        referralCode: code,
        referredById: referrerId,
        isVerified: false,
      },
    });

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      referralCode: user.referralCode,
      isVerified: user.isVerified,
      balance: user.balance,
      activationFee: Number(process.env.NEXT_PUBLIC_ACTIVATION_FEE || 150),
    });
  } catch (err) {
    console.error('[register] error:', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
