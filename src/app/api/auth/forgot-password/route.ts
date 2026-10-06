import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCode, sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const ForgotSchema = z.object({ email: z.string().email() });

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Generates a 6-digit reset code + sends email. Doesn't reveal whether email exists.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid email' }, { status: 400 });
    }
    const { email } = parsed.data;

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Don't reveal whether the email exists — security best practice
      // But still return success to prevent email enumeration
      return NextResponse.json({ message: 'If the email exists, a reset code has been sent.' });
    }

    // Throttle: 60 seconds between requests
    if (user.resetTokenExpiresAt && user.resetTokenExpiresAt > new Date(Date.now() + 14 * 60 * 1000)) {
      return NextResponse.json({ message: 'If the email exists, a reset code has been sent.' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.user.update({
      where: { id: user.id },
      data: { resetToken: code, resetTokenExpiresAt: expiresAt },
    });

    sendPasswordResetEmail(user.email, code, user.username)
      .then(() => console.log(`[forgot-password] reset code sent to ${user.email}`))
      .catch(err => console.error('[forgot-password] send error:', err));

    return NextResponse.json({ message: 'If the email exists, a reset code has been sent.' });
  } catch (err) {
    console.error('[forgot-password] error:', err);
    return NextResponse.json({ error: 'Failed to send reset code' }, { status: 500 });
  }
}
