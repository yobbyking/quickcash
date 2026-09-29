import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queryStkStatus } from '@/lib/swiftwallet';

/**
 * SwiftWallet v3 webhook — receives STK push payment confirmations.
 *
 * Headers we might receive:
 *   Authorization: Bearer <our api key> (SwiftWallet may sign webhook calls)
 *   X-Signature: ...
 *
 * Body formats we handle (we accept a wide range because SwiftWallet's
 * exact payload schema isn't fully documented; we look for known keys):
 *
 *   {
 *     "CheckoutRequestID": "...",
 *     "MerchantRequestID": "...",
 *     "ResultCode": 0,
 *     "ResultDesc": "Success",
 *     "MpesaReceiptNumber": "RGJ2XK...",
 *     "Amount": 150,
 *     "PhoneNumber": "254722...",
 *     "TransactionDate": "20260925123456"
 *   }
 *
 *   — or —
 *
 *   {
 *     "event": "stk.success",
 *     "data": { "checkout_request_id": "...", "mpesa_receipt": "...", "amount": 150, "phone": "..." }
 *   }
 */

function extractPayload(body: any): {
  checkoutRequestId?: string;
  merchantRequestId?: string;
  status?: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PENDING';
  mpesaReceipt?: string;
  phone?: string;
  amount?: number;
  failureReason?: string;
  raw: any;
} {
  // Try multiple known formats
  const data = body?.data || body;

  // Find checkout request ID (multiple naming conventions)
  const checkoutRequestId = data?.CheckoutRequestID
    || data?.checkout_request_id
    || data?.checkoutRequestId
    || body?.CheckoutRequestID;

  const merchantRequestId = data?.MerchantRequestID
    || data?.merchant_request_id
    || data?.merchantRequestId
    || body?.MerchantRequestID;

  const mpesaReceipt = data?.MpesaReceiptNumber
    || data?.mpesa_receipt
    || data?.mpesaReceipt
    || data?.receipt_number
    || data?.ReceiptNumber;

  const phone = data?.PhoneNumber
    || data?.phone
    || data?.phone_number
    || body?.PhoneNumber;

  const amount = Number(data?.Amount || data?.amount || body?.Amount || 0) || 0;

  // Determine status
  let status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PENDING' = 'PENDING';
  const resultCode = Number(data?.ResultCode || data?.result_code || body?.ResultCode || 0);
  const event = (data?.event || body?.event || '').toString().toLowerCase();
  const resultDesc = (data?.ResultDesc || data?.result_desc || body?.ResultDesc || '').toString();

  if (event.includes('success') || event === 'stk.success' || event === 'b2c.success') {
    status = 'COMPLETED';
  } else if (event.includes('fail') || event === 'stk.failed' || event === 'b2c.failed') {
    status = 'FAILED';
  } else if (resultCode === 0 && (mpesaReceipt || event === 'stk.success')) {
    status = 'COMPLETED';
  } else if (resultCode !== 0 && resultCode !== undefined) {
    // Non-zero result code from M-Pesa = failure (e.g. 1032 = cancelled)
    status = resultCode === 1032 ? 'CANCELLED' : 'FAILED';
  } else if (mpesaReceipt) {
    status = 'COMPLETED';
  }

  const failureReason = status !== 'COMPLETED' ? (resultDesc || 'Payment not completed') : undefined;

  return { checkoutRequestId, merchantRequestId, status, mpesaReceipt, phone, amount, failureReason, raw: body };
}

export async function POST(req: NextRequest) {
  try {
    // Optional: verify Authorization header
    const authHeader = req.headers.get('authorization') || '';
    const expectedKey = process.env.SWIFTWALLET_API_KEY || '';
    // If header is present, validate it. If absent, accept (dev-friendly).
    if (authHeader && expectedKey) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      if (token !== expectedKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

    const extracted = extractPayload(body);

    if (!extracted.checkoutRequestId) {
      // Some webhooks may send merchant_request_id only — try by phone+amount lookup
      // For safety, we just acknowledge
      console.warn('[webhook] No CheckoutRequestID in payload:', JSON.stringify(body).slice(0, 500));
      return NextResponse.json({ received: true, matched: false, reason: 'no_checkout_id' });
    }

    // Find the payment record
    const payment = await db.payment.findFirst({
      where: { checkoutRequestId: extracted.checkoutRequestId },
    });

    if (!payment) {
      console.warn(`[webhook] No payment found for checkout ${extracted.checkoutRequestId}`);
      return NextResponse.json({ received: true, matched: false, reason: 'no_payment' });
    }

    // Update payment
    if (payment.status === 'COMPLETED') {
      // Idempotent: already processed
      return NextResponse.json({ received: true, matched: true, status: 'ALREADY_COMPLETED' });
    }

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: extracted.status || 'PENDING',
        mpesaReceipt: extracted.mpesaReceipt,
        failureReason: extracted.failureReason,
        webhookReceived: true,
        webhookPayload: JSON.stringify(body).slice(0, 4000),
      },
    });

    if (extracted.status === 'COMPLETED') {
      // Apply effects based on payment type
      const user = await db.user.findUnique({ where: { id: payment.userId } });
      if (!user) return NextResponse.json({ received: true, matched: true, error: 'user_gone' });

      const txRef = `TX${Date.now()}${Math.floor(Math.random() * 1000)}`;

      if (payment.type === 'ACTIVATION') {
        // Mark user as verified + give referral bonus to referrer (10 KES)
        await db.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });

        // Create a CREDIT transaction for the activation
        await db.transaction.create({
          data: {
            userId: user.id,
            type: 'ACTIVATION',
            amount: payment.amount,
            direction: 'DEBIT',
            status: 'COMPLETED',
            reference: txRef,
            description: 'Account activation fee paid',
            relatedPaymentId: payment.id,
          },
        });

        // Referral bonus
        if (user.referredById) {
          await db.user.update({
            where: { id: user.referredById },
            data: { balance: { increment: 10 } },
          });
          await db.transaction.create({
            data: {
              userId: user.referredById,
              type: 'REFERRAL_BONUS',
              amount: 10,
              direction: 'CREDIT',
              status: 'COMPLETED',
              reference: `BONUS${Date.now()}${Math.floor(Math.random() * 1000)}`,
              description: `Referral bonus for ${user.username}`,
            },
          });
        }
      } else if (payment.type === 'DEPOSIT') {
        // Credit user's balance
        await db.user.update({
          where: { id: user.id },
          data: { balance: { increment: payment.amount } },
        });
        await db.transaction.create({
          data: {
            userId: user.id,
            type: 'DEPOSIT',
            amount: payment.amount,
            direction: 'CREDIT',
            status: 'COMPLETED',
            reference: txRef,
            description: `M-Pesa deposit ${extracted.mpesaReceipt || ''}`.trim(),
            relatedPaymentId: payment.id,
          },
        });
      } else if (payment.type === 'WITHDRAWAL') {
        // Withdrawal B2C success — balance was already debited when initiated
        // Mark related transaction COMPLETED
        await db.transaction.updateMany({
          where: { relatedPaymentId: payment.id },
          data: { status: 'COMPLETED' },
        });
      }
    } else if (extracted.status === 'FAILED' || extracted.status === 'CANCELLED') {
      if (payment.type === 'WITHDRAWAL') {
        // Refund the held balance
        await db.user.update({
          where: { id: payment.userId },
          data: { balance: { increment: payment.amount } },
        });
        await db.transaction.updateMany({
          where: { relatedPaymentId: payment.id },
          data: { status: 'FAILED' },
        });
      }
    }

    return NextResponse.json({ received: true, matched: true, status: extracted.status });
  } catch (err) {
    console.error('[webhook] error:', err);
    // Return 200 anyway so SwiftWallet doesn't retry-spam us
    return NextResponse.json({ received: true, error: 'internal_error' }, { status: 200 });
  }
}

// GET endpoint for quick health check
export async function GET() {
  return NextResponse.json({ ok: true, service: 'swiftpay-webhook' });
}
