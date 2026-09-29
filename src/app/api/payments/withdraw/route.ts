import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { initiateB2C, normalizePhone } from '@/lib/swiftwallet';
import { z } from 'zod';

const WithdrawSchema = z.object({
  amount: z.number().min(50).max(70000),
  phone: z.string().min(10).optional(), // optional: defaults to user's registered phone
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const u = await db.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!u.isVerified) return NextResponse.json({ error: 'Account not verified' }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = WithdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const phone = parsed.data.phone || u.phone;
    const amount = parsed.data.amount;

    if (amount > u.balance) {
      return NextResponse.json({ error: `Insufficient balance. Your balance is ${u.balance} KES.` }, { status: 400 });
    }

    const accountRef = `WTH${u.id.slice(-6).toUpperCase()}`;
    const description = `Withdrawal ${amount} KES`;

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: u.id,
        type: 'WITHDRAWAL',
        amount,
        phone: normalizePhone(phone),
        status: 'PENDING',
        accountReference: accountRef,
        description,
      },
    });

    // Deduct immediately (held in escrow conceptually)
    await db.user.update({
      where: { id: u.id },
      data: { balance: { decrement: amount } },
    });

    // Create transaction record (DEBIT, PENDING)
    const txRef = `TX${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await db.transaction.create({
      data: {
        userId: u.id,
        type: 'WITHDRAWAL',
        amount,
        direction: 'DEBIT',
        status: 'PENDING',
        reference: txRef,
        description,
        relatedPaymentId: payment.id,
      },
    });

    // Initiate B2C
    const b2c = await initiateB2C({
      phone,
      amount,
      accountReference: accountRef,
      description,
    });

    if (!b2c.success) {
      // Rollback the balance deduction
      await db.user.update({
        where: { id: u.id },
        data: { balance: { increment: amount } },
      });
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: (b2c as { error?: string }).error || 'B2C failed' },
      });
      await db.transaction.updateMany({
        where: { relatedPaymentId: payment.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ error: (b2c as { error?: string }).error || 'Withdrawal failed. Balance refunded.' }, { status: 502 });
    }

    // Save merchant request details (if returned)
    const data = b2c.data as { CheckoutRequestID?: string; MerchantRequestID?: string; checkout_request_id?: string; merchant_request_id?: string } | undefined;
    const checkoutId = data?.CheckoutRequestID || data?.checkout_request_id;
    const merchantId = data?.MerchantRequestID || data?.merchant_request_id;

    if (checkoutId) {
      await db.payment.update({
        where: { id: payment.id },
        data: { checkoutRequestId: checkoutId, merchantRequestId: merchantId },
      });
    }

    return NextResponse.json({
      paymentId: payment.id,
      checkoutRequestId: checkoutId,
      message: 'Withdrawal initiated. You will receive M-Pesa within 1-2 minutes.',
    });
  } catch (err) {
    console.error('[withdraw] error:', err);
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 });
  }
}
