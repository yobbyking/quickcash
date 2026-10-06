import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCode, sendVerificationEmail } from '@/lib/email';
import { z } from 'zod';

const ResendSchema = z.object({ email: z.string().email() });

/**
 * POST /api/auth/resend-verification
 * Body: { email }
 * Generates a new 6-digit verification code + sends email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = ResendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid email' }, { status: 400 });
    }
    const { email } = parsed.data;

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    if (user.isEmailVerified) return NextResponse.json({ error: 'Email already verified' }, { status: 400 });

    // Throttle: 60 seconds between resends
    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt > new Date(Date.now() + 9 * 60 * 1000)) {
      return NextResponse.json({ error: 'Please wait 60 seconds before requesting a new code' }, { status: 429 });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.user.update({
      where: { id: user.id },
      data: { verificationCode: code, verificationCodeExpiresAt: expiresAt },
    });

    sendVerificationEmail(user.email, code, user.username)
      .then(() => console.log(`[resend] verification code sent to ${user.email}`))
      .catch(err => console.error('[resend] send error:', err));

    return NextResponse.json({ message: 'Verification code sent. Check your email.' });
  } catch (err) {
    console.error('[resend] error:', err);
    return NextResponse.json({ error: 'Failed to resend code' }, { status: 500 });
  }
}
