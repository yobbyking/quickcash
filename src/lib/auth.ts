/**
 * Auth helpers — password hashing + JWT issuance + session management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'swiftpay_session';
const SESSION_DAYS = 7;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    return decoded;
  } catch {
    return null;
  }
}

export function generateReferralCode(seed?: string): string {
  const base = (seed || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return (base + rand).slice(0, 8) || rand;
}

export async function createSession(userId: string) {
  const token = signToken(userId);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { userId, token, expiresAt },
  });
  return { token, expiresAt };
}

export async function revokeSession(token: string) {
  try {
    await db.session.deleteMany({ where: { token } });
  } catch {}
}

export async function getUserFromRequest(request: Request): Promise<{ id: string } | null> {
  // 1) Try Authorization header
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }
  // 2) Try cookie
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (match) token = match[1];
  }
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  // Verify session is still active
  const session = await db.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;

  return { id: decoded.sub };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
