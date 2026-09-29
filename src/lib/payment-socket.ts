/**
 * Client-side payment status helper.
 *
 * Originally used Socket.IO for live updates — but Vercel doesn't support
 * long-running WebSocket servers. We've moved to pure HTTP polling,
 * which works on any platform and is fast enough (1-4s intervals).
 *
 * Kept the function name for backward compat with the auth/verify and
 * dashboard/deposit pages.
 */

export interface PaymentUpdate {
  paymentId: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PENDING';
  failureReason?: string;
}

/**
 * Polls /api/payments/status every `intervalMs` until the payment
 * reaches a terminal state (COMPLETED / FAILED / CANCELLED) or the
 * callback returns false.
 *
 * Returns an unsubscribe function that stops the polling.
 */
export function subscribeToPayment(
  paymentId: string,
  onUpdate: (data: PaymentUpdate) => void,
  intervalMs: number = 3000,
): () => void {
  let active = true;
  let timer: NodeJS.Timeout | null = null;

  async function check() {
    if (!active) return;
    try {
      const res = await fetch(`/api/payments/status?paymentId=${paymentId}`);
      if (!res.ok) return;
      const data = await res.json();
      onUpdate({
        paymentId,
        status: data.status,
        failureReason: data.failureReason,
      });
      if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
        active = false;
        return;
      }
    } catch {
      // network blip — keep polling
    }
    if (active) {
      timer = setTimeout(check, intervalMs);
    }
  }

  // Kick off first check after a short delay (give the STK push time to register)
  timer = setTimeout(check, 1500);

  return () => {
    active = false;
    if (timer) clearTimeout(timer);
  };
}
