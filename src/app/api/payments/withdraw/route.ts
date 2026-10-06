import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { initiateB2C, normalizePhone } from '@/lib/swiftwallet';
import { z } from 'zod';

const WithdrawSchema = z.object({
  amount: z.number().min(50).max(70000),
  phone: z.string().min(10).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!user.isActivated) return NextResponse.json({ error: 'Account not activated' }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = WithdrawSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    const phone = parsed.data.phone || user.phone;
    const amount = parsed.data.amount;
    if (amount > user.balance) {
      return NextResponse.json({ error: `Insufficient balance. Available: KES ${user.balance}` }, { status: 400 });
    }

    const accountRef = `WTH${user.id.slice(-6).toUpperCase()}`;
    const description = `Withdrawal ${amount} KES`;
    const payment = await db.payment.create({
      data: { userId: user.id, type: 'WITHDRAWAL', amount, phone: normalizePhone(phone), status: 'PENDING', accountReference: accountRef, description },
    });

    // Deduct balance immediately (held in escrow)
    await db.user.update({ where: { id: user.id }, data: { balance: { decrement: amount } } });
    await db.transaction.create({
      data: {
        userId: user.id, type: 'WITHDRAWAL', amount, direction: 'DEBIT', status: 'PENDING',
        reference: `TX${Date.now()}${Math.floor(Math.random() * 1000)}`,
        description, relatedPaymentId: payment.id,
      },
    });

    const b2c = await initiateB2C({ phone, amount, accountReference: accountRef, description });
    if (!b2c.success) {
      // Refund
      await db.user.update({ where: { id: user.id }, data: { balance: { increment: amount } } });
      await db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: (b2c as any).error || 'B2C failed' } });
      await db.transaction.updateMany({ where: { relatedPaymentId: payment.id }, data: { status: 'FAILED' } });
      return NextResponse.json({ error: (b2c as any).error || 'Withdrawal failed. Refunded.' }, { status: 502 });
    }

    const data = b2c.data as any;
    const checkoutId = data?.CheckoutRequestID || data?.checkout_request_id;
    if (checkoutId) await db.payment.update({ where: { id: payment.id }, data: { checkoutRequestId: checkoutId } });

    return NextResponse.json({ paymentId: payment.id, message: 'Withdrawal initiated. M-Pesa arrives in 1-2 min.' });
  } catch (err) {
    console.error('[withdraw] error:', err);
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 });
  }
}
