import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { initiateStkPush, getPublicWebhookUrl, normalizePhone } from '@/lib/swiftwallet';
import { z } from 'zod';

const DepositSchema = z.object({
  amount: z.number().min(1).max(70000),
  phone: z.string().min(10).optional(), // optional: if not provided, use user's registered phone
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const u = await db.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!u.isVerified) return NextResponse.json({ error: 'Account not verified. Please activate first.' }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = DepositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const phone = parsed.data.phone || u.phone;
    const amount = parsed.data.amount;

    // Throttle: max 1 pending deposit per 2 minutes
    const recent = await db.payment.findFirst({
      where: {
        userId: u.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });
    if (recent) {
      return NextResponse.json({
        error: 'A deposit is already pending. Complete it first.',
        paymentId: recent.id,
      }, { status: 429 });
    }

    const accountRef = `DEP${u.id.slice(-6).toUpperCase()}`;
    const description = `Deposit ${amount} KES`;

    const payment = await db.payment.create({
      data: {
        userId: u.id,
        type: 'DEPOSIT',
        amount,
        phone: normalizePhone(phone),
        status: 'PENDING',
        accountReference: accountRef,
        description,
      },
    });

    const webhookUrl = getPublicWebhookUrl(req);
    const stk = await initiateStkPush({
      phone,
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
      return NextResponse.json({ error: stk.error || 'Failed to send M-Pesa prompt' }, { status: 502 });
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
      checkoutRequestId: stk.checkoutRequestId,
      customerMessage: stk.customerMessage || 'Enter your M-Pesa PIN on your phone to complete the deposit.',
    });
  } catch (err) {
    console.error('[deposit] error:', err);
    return NextResponse.json({ error: 'Deposit failed' }, { status: 500 });
  }
}
