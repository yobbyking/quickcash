import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/payments/status?paymentId=X
 * Returns current payment status for polling.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const paymentId = new URL(req.url).searchParams.get('paymentId');
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 });

    const payment = await db.payment.findFirst({
      where: { id: paymentId, userId: user.id },
      select: { id: true, type: true, amount: true, phone: true, status: true, mpesaReceipt: true, failureReason: true, tier: true, createdAt: true, updatedAt: true },
    });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    return NextResponse.json(payment);
  } catch (err) {
    console.error('[payment-status] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
