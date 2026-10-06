import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest, TIERS } from '@/lib/auth';
import { initiateStkPush, getPublicWebhookUrl, normalizePhone } from '@/lib/swiftwallet';

/**
 * POST /api/auth/activate
 * Body: { tier }  (silver | gold | vip — defaults to user's current tier)
 * Initiates an STK push for the activation fee of the given tier.
 * Once paid, the user is marked as activated and locked to that tier.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestedTier = body.tier || user.tier;
    if (!TIERS[requestedTier as keyof typeof TIERS]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (user.isActivated) {
      return NextResponse.json({ error: 'Account already activated' }, { status: 400 });
    }

    // Check for any recent PENDING activation payment within last 2 minutes
    const recent = await db.payment.findFirst({
      where: {
        userId: user.id,
        type: 'ACTIVATION',
        status: 'PENDING',
        createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      return NextResponse.json({
        error: 'A payment request is already pending. Check your phone.',
        paymentId: recent.id,
      }, { status: 429 });
    }

    const amount = TIERS[requestedTier as keyof typeof TIERS].activationFee;
    const accountRef = `ACT${user.id.slice(-6).toUpperCase()}`;
    const description = `${requestedTier.toUpperCase()} Tier Activation`;

    const payment = await db.payment.create({
      data: {
        userId: user.id,
        type: 'ACTIVATION',
        amount,
        phone: normalizePhone(user.phone),
        status: 'PENDING',
        tier: requestedTier,
        accountReference: accountRef,
        description,
      },
    });

    const webhookUrl = getPublicWebhookUrl(req);
    const stk = await initiateStkPush({
      phone: user.phone,
      amount,
      accountReference: accountRef,
      description,
      webhookUrl,
    });

    if (!stk.success || !stk.checkoutRequestId) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: stk.error || 'STK push failed' },
      });
      return NextResponse.json({ error: stk.error || 'Failed to initiate M-Pesa prompt' }, { status: 502 });
    }

    await db.payment.update({
      where: { id: payment.id },
      data: {
        checkoutRequestId: stk.checkoutRequestId,
        merchantRequestId: stk.merchantRequestId,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      tier: requestedTier,
      amount,
      checkoutRequestId: stk.checkoutRequestId,
      customerMessage: stk.customerMessage || 'M-Pesa prompt sent. Enter your PIN.',
    });
  } catch (err) {
    console.error('[activate] error:', err);
    return NextResponse.json({ error: 'Failed to initiate activation' }, { status: 500 });
  }
}
