import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { initiateStkPush, getPublicWebhookUrl, normalizePhone } from '@/lib/swiftwallet';

/**
 * Initiate the activation payment (150 KES) via STK push.
 * The user must complete this payment to verify their account.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const u = await db.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (u.isVerified) return NextResponse.json({ error: 'Account already verified' }, { status: 400 });

    // Check for any recent PENDING activation payment within last 2 minutes (avoid spam)
    const recent = await db.payment.findFirst({
      where: {
        userId: u.id,
        type: 'ACTIVATION',
        status: 'PENDING',
        createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      return NextResponse.json({
        error: 'A payment request is already pending. Check your phone for the M-Pesa prompt.',
        paymentId: recent.id,
        checkoutRequestId: recent.checkoutRequestId,
      }, { status: 429 });
    }

    const amount = Number(process.env.NEXT_PUBLIC_ACTIVATION_FEE || 150);
    const accountRef = `ACT${u.id.slice(-6).toUpperCase()}`;
    const description = 'Account Activation Fee';

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: u.id,
        type: 'ACTIVATION',
        amount,
        phone: normalizePhone(u.phone),
        status: 'PENDING',
        accountReference: accountRef,
        description,
      },
    });

    // Initiate STK push
    const webhookUrl = getPublicWebhookUrl(req);
    const stk = await initiateStkPush({
      phone: u.phone,
      amount,
      accountReference: accountRef,
      description,
      webhookUrl,
    });

    if (!stk.success || !stk.checkoutRequestId) {
      // Mark payment as FAILED
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: stk.error || 'STK push failed' },
      });
      return NextResponse.json({
        error: stk.error || 'Failed to initiate M-Pesa prompt. Try again.',
        paymentId: payment.id,
      }, { status: 502 });
    }

    // Save checkout IDs
    await db.payment.update({
      where: { id: payment.id },
      data: {
        checkoutRequestId: stk.checkoutRequestId,
        merchantRequestId: stk.merchantRequestId,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      checkoutRequestId: stk.checkoutRequestId,
      customerMessage: stk.customerMessage || 'M-Pesa prompt sent to your phone. Enter your M-Pesa PIN to authorize.',
    });
  } catch (err) {
    console.error('[verify/initiate] error:', err);
    return NextResponse.json({ error: 'Failed to initiate verification payment' }, { status: 500 });
  }
}
