import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth';
import { z } from 'zod';

const LoginSchema = z.object({
  identifier: z.string().min(3), // email OR username
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const { identifier, password } = parsed.data;
    const idLower = identifier.toLowerCase().trim();

    // Match by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: idLower }, { username: idLower }],
      },
    });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    if (!user.isActive) return NextResponse.json({ error: 'Account suspended. Contact support.' }, { status: 403 });

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
    console.error('[login] error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
