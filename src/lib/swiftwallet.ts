/**
 * SwiftWallet v3 API client — M-Pesa STK push + B2C payments
 *
 * Docs: https://api.swiftwallet.co.ke/v3
 * Auth: Bearer sw_xxx
 */

import { db } from '@/lib/db';

const API_URL = process.env.SWIFTWALLET_API_URL || 'https://api.swiftwallet.co.ke/v3';
const API_KEY = process.env.SWIFTWALLET_API_KEY || '';

export interface StkPushRequest {
  phone: string;          // 2547XXXXXXXX (no + or 0)
  amount: number;
  accountReference: string; // max 12 chars
  description?: string;
  webhookUrl?: string;     // your webhook URL for confirmation
}

export interface StkPushResponse {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
  error?: string;
}

export interface WebhookPayload {
  checkoutRequestId?: string;
  merchantRequestId?: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PENDING';
  mpesaReceipt?: string;
  phone?: string;
  amount?: number;
  failureReason?: string;
  transactionDate?: string;
  resultType?: string;
  raw?: unknown;
}

/**
 * Initiate an STK push payment via SwiftWallet v3.
 * The user receives a SIM-toolkit prompt on their phone to enter M-Pesa PIN.
 */
export async function initiateStkPush(req: StkPushRequest): Promise<StkPushResponse> {
  if (!API_KEY) {
    return { success: false, error: 'SWIFTWALLET_API_KEY is not configured' };
  }

  // Normalize phone: remove +, spaces, leading 0; if starts with 254 keep, else prepend 254
  const phone = normalizePhone(req.phone);

  const body: Record<string, unknown> = {
    phone,
    amount: Math.round(req.amount),
    account_reference: req.accountReference.slice(0, 12),
    description: (req.description || req.accountReference).slice(0, 50),
  };

  // Add webhook URL if provided (SwiftWallet v3 supports auto-callback)
  if (req.webhookUrl) {
    body.webhook_url = req.webhookUrl;
  }

  try {
    const res = await fetch(`${API_URL}/stk/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
      // SwiftWallet sometimes has slow response; give 30s
      signal: AbortSignal.timeout(30_000),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.message || data?.error || `HTTP ${res.status}`,
      };
    }

    // SwiftWallet v3 typical success response:
    // { "status":"success","data":{ "CheckoutRequestID":"...", "MerchantRequestID":"..." } }
    const checkout = data?.data?.CheckoutRequestID || data?.data?.checkout_request_id || data?.CheckoutRequestID;
    const merchant = data?.data?.MerchantRequestID || data?.data?.merchant_request_id || data?.MerchantRequestID;

    if (!checkout) {
      return {
        success: false,
        error: data?.message || 'No CheckoutRequestID returned by SwiftWallet',
      };
    }

    return {
      success: true,
      checkoutRequestId: checkout,
      merchantRequestId: merchant,
      responseCode: data?.data?.ResponseCode || data?.data?.response_code,
      responseDescription: data?.data?.ResponseDescription || data?.data?.response_description,
      customerMessage: data?.data?.CustomerMessage || data?.data?.customer_message,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Network error: ${msg}` };
  }
}

/**
 * Query STK push status from SwiftWallet (used as a fallback to webhook).
 */
export async function queryStkStatus(checkoutRequestId: string) {
  if (!API_KEY) return { success: false, error: 'API key missing' };

  try {
    const res = await fetch(`${API_URL}/stk/status/${checkoutRequestId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, error: data?.message || `HTTP ${res.status}` };
    return { success: true, data: data?.data || data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Network error: ${msg}` };
  }
}

/**
 * Initiate a B2C payment (pay out to a user's M-Pesa — for withdrawals).
 */
export async function initiateB2C(params: {
  phone: string;
  amount: number;
  accountReference: string;
  description?: string;
  occassion?: string;
  commandId?: 'BusinessPayment' | 'SalaryPayment' | 'PromotionPayment';
}) {
  if (!API_KEY) return { success: false, error: 'API key missing' };

  const phone = normalizePhone(params.phone);
  const body = {
    phone,
    amount: Math.round(params.amount),
    account_reference: params.accountReference.slice(0, 12),
    description: (params.description || params.accountReference).slice(0, 50),
    command_id: params.commandId || 'BusinessPayment',
  };

  try {
    const res = await fetch(`${API_URL}/b2c/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, error: data?.message || `HTTP ${res.status}` };
    return { success: true, data: data?.data || data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Network error: ${msg}` };
  }
}

export function normalizePhone(input: string): string {
  let p = (input || '').trim().replace(/\s/g, '');
  // Remove leading +
  if (p.startsWith('+')) p = p.slice(1);
  // Convert 07XX / 01XX -> 2547XX
  if (p.startsWith('0')) p = '254' + p.slice(1);
  // Convert 7XX (no leading) -> 2547XX
  if (p.startsWith('7') && p.length === 9) p = '254' + p;
  if (p.startsWith('1') && p.length === 9) p = '254' + p;
  return p;
}

/**
 * Compute a publicly-exposed webhook URL for SwiftWallet to call back.
 * Uses the request's host so it works in any environment.
 */
export function getPublicWebhookUrl(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (forwarded?.includes('localhost') ? 'http' : 'https');
  const host = forwarded || 'localhost:3000';
  return `${proto}://${host}/api/payments/webhook`;
}
