'use client';

/**
 * apiFetch — client-side fetch wrapper that auto-attaches the Firebase ID token.
 *
 * Usage:
 *   import { apiFetch } from '@/lib/api-fetch';
 *   const data = await apiFetch('/api/auth/me');
 *   const res = await apiFetch('/api/opportunities/list?type=TASK', { method: 'POST', body: JSON.stringify({...}) });
 */

import { auth } from '@/lib/firebase';

export async function apiFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  // Get the Firebase user
  const user = auth.currentUser;
  let headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> || {}),
  };
  if (user) {
    try {
      const idToken = await user.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    } catch (err) {
      // ignore — request will fail with 401
    }
  }
  if (opts.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...opts, headers });
}

/**
 * apiJson — convenience wrapper that returns JSON or throws on error.
 */
export async function apiJson<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await apiFetch(url, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data as any)?.error || `HTTP ${res.status}`);
  }
  return data as T;
}
