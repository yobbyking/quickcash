import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Compute today's earnings
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayAgg = await db.transaction.aggregate({
      where: {
        userId: user.id,
        direction: 'CREDIT',
        status: 'COMPLETED',
        createdAt: { gte: startOfToday },
      },
      _sum: { amount: true },
    });
    const todayEarned = todayAgg._sum.amount || 0;

    // Referral stats
    const referralCount = await db.user.count({ where: { referredById: user.id } });
    const verifiedReferrals = await db.user.count({
      where: { referredById: user.id, isActivated: true },
    });

    // Task count by tier
    const tierTasks = await db.opportunity.groupBy({
      by: ['tier'],
      where: { status: 'active', type: 'TASK' },
      _count: { _all: true },
    });
    const tierSurveys = await db.opportunity.groupBy({
      by: ['tier'],
      where: { status: 'active', type: 'SURVEY' },
      _count: { _all: true },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      tier: user.tier,
      isActivated: user.isActivated,
      balance: user.balance,
      totalEarned: user.totalEarned,
      tasksCompleted: user.tasksCompleted,
      adsWatchedToday: user.adsWatchedToday,
      adsWatchedTotal: user.adsWatchedTotal,
      todayEarned,
      referralCount,
      verifiedReferrals,
      referralCode: user.referralCode,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAdmin: user.isAdmin,
      tierBreakdown: {
        silver: {
          tasks: tierTasks.find(t => t.tier === 'silver')?._count._all || 0,
          surveys: tierSurveys.find(t => t.tier === 'silver')?._count._all || 0,
        },
        gold: {
          tasks: tierTasks.find(t => t.tier === 'gold')?._count._all || 0,
          surveys: tierSurveys.find(t => t.tier === 'gold')?._count._all || 0,
        },
        vip: {
          tasks: tierTasks.find(t => t.tier === 'vip')?._count._all || 0,
          surveys: tierSurveys.find(t => t.tier === 'vip')?._count._all || 0,
        },
      },
    });
  } catch (err) {
    console.error('[me] error:', err);
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 });
  }
}
