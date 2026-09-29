import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * Returns the current status of a payment (used for polling when the
 * user is waiting for the STK push to complete on their phone).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const url = new URL(req.url);
    const paymentId = url.searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 });
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        type: true,
        amount: true,
        phone: true,
        status: true,
        mpesaReceipt: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    // Ownership check
    const u = await db.user.findUnique({ where: { id: user.id }, select: { id: true } });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userPayment = await db.payment.findFirst({
      where: { id: paymentId, userId: user.id },
      select: { id: true },
    });
    if (!userPayment) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    return NextResponse.json(payment);
  } catch (err) {
    console.error('[payment-status] error:', err);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
