import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';
import { TIERS } from '@/lib/auth';
import { z } from 'zod';

const VerifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { email, code } = parsed.data;

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    if (user.isEmailVerified) return NextResponse.json({ error: 'Email already verified' }, { status: 400 });

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      return NextResponse.json({ error: 'No verification code. Request a new one.' }, { status: 400 });
    }
    if (user.verificationCode !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }
    if (user.verificationCodeExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    // Send welcome email (async)
    const tierInfo = TIERS[user.tier as keyof typeof TIERS] || TIERS.silver;
    sendWelcomeEmail(user.email, user.username, user.tier, tierInfo.activationFee, user.referralCode)
      .then(() => console.log(`[verify-email] welcome email sent to ${user.email}`))
      .catch(err => console.error('[verify-email] welcome send error:', err));

    return NextResponse.json({
      message: 'Email verified successfully! Welcome to QuickCash.',
      isEmailVerified: true,
    });
  } catch (err) {
    console.error('[verify-email] error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
