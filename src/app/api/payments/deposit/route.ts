import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { initiateStkPush, getPublicWebhookUrl, normalizePhone } from '@/lib/swiftwallet';
import { z } from 'zod';

const DepositSchema = z.object({
  amount: z.number().min(1).max(70000),
  phone: z.string().min(10).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!user.isActivated) {
      return NextResponse.json({ error: 'Activate your account first' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = DepositSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const phone = parsed.data.phone || user.phone;
    const amount = parsed.data.amount;

    // Throttle: 1 pending deposit per 2 min
    const recent = await db.payment.findFirst({
      where: { userId: user.id, type: 'DEPOSIT', status: 'PENDING', createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) } },
    });
    if (recent) {
      return NextResponse.json({ error: 'A deposit is already pending', paymentId: recent.id }, { status: 429 });
    }

    const accountRef = `DEP${user.id.slice(-6).toUpperCase()}`;
    const description = `Deposit ${amount} KES`;
    const payment = await db.payment.create({
      data: { userId: user.id, type: 'DEPOSIT', amount, phone: normalizePhone(phone), status: 'PENDING', accountReference: accountRef, description },
    });

    const webhookUrl = getPublicWebhookUrl(req);
    const stk = await initiateStkPush({ phone, amount, accountReference: accountRef, description, webhookUrl });
    if (!stk.success || !stk.checkoutRequestId) {
      await db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: stk.error || 'STK failed' } });
      return NextResponse.json({ error: stk.error || 'Failed to send M-Pesa prompt' }, { status: 502 });
    }
    await db.payment.update({ where: { id: payment.id }, data: { checkoutRequestId: stk.checkoutRequestId, merchantRequestId: stk.merchantRequestId } });
    return NextResponse.json({ paymentId: payment.id, checkoutRequestId: stk.checkoutRequestId });
  } catch (err) {
    console.error('[deposit] error:', err);
    return NextResponse.json({ error: 'Deposit failed' }, { status: 500 });
  }
}
