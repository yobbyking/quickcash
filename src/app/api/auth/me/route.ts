import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest, clearSessionCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const u = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, username: true, phone: true,
        referralCode: true, isVerified: true, isActive: true,
        balance: true, totalEarned: true, tasksCompleted: true,
        adsWatchedToday: true, adsWatchedTotal: true, lastAdDay: true,
        createdAt: true, referredById: true,
      },
    });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // If referredById set, fetch referrer's username
    let referrer = null;
    if (u.referredById) {
      const ref = await db.user.findUnique({
        where: { id: u.referredById },
        select: { username: true, referralCode: true },
      });
      referrer = ref;
    }

    // Fetch referral stats
    const referralCount = await db.user.count({ where: { referredById: u.id } });
    const verifiedReferrals = await db.user.count({
      where: { referredById: u.id, isVerified: true },
    });

    // Compute today's earnings (sum of CREDIT transactions today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayAgg = await db.transaction.aggregate({
      where: {
        userId: u.id,
        direction: 'CREDIT',
        status: 'COMPLETED',
        createdAt: { gte: startOfToday },
      },
      _sum: { amount: true },
    });
    const todayEarned = todayAgg._sum.amount || 0;

    // Compute ad stats today (reset if new day)
    const today = new Date().toISOString().slice(0, 10);
    let adsWatchedToday = u.adsWatchedToday;
    if (u.lastAdDay !== today) {
      adsWatchedToday = 0;
    }

    return NextResponse.json({
      ...u,
      referrer,
      referralCount,
      verifiedReferrals,
      todayEarned,
      adsWatchedToday,
      activationFee: Number(process.env.NEXT_PUBLIC_ACTIVATION_FEE || 150),
      bclb: process.env.NEXT_PUBLIC_BCLB_NUMBER || '7YGEB3OD',
    });
  } catch (err) {
    console.error('[me] error:', err);
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract token directly from cookie/header (we don't need user info)
    const authHeader = req.headers.get('authorization');
    let token: string | null = null;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    if (!token) {
      const cookie = req.headers.get('cookie') || '';
      const m = cookie.match(/swiftpay_session=([^;]+)/);
      if (m) token = m[1];
    }
    if (token) {
      await db.session.deleteMany({ where: { token } });
    }
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[logout] error:', err);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
