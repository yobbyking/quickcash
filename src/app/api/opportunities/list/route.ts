import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/opportunities/list
 * Query params:
 *   type  = TASK | SURVEY (optional, omit to get both)
 *   tier  = silver | gold | vip (optional, omit to get all)
 *   limit = number (default 200)
 *
 * Authenticated users get tier filtering based on their tier:
 * silver users only see silver opportunities, gold users see silver+gold, etc.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || undefined;
    const tierParam = url.searchParams.get('tier');
    const limit = Math.min(Number(url.searchParams.get('limit') || 200), 500);

    // Tier filtering: silver only sees silver, gold sees silver+gold, vip sees all
    const tierOrder = { silver: ['silver'], gold: ['silver', 'gold'], vip: ['silver', 'gold', 'vip'] };
    const allowedTiers = tierOrder[user.tier as keyof typeof tierOrder] || ['silver'];

    let tiersToQuery: string[];
    if (tierParam && allowedTiers.includes(tierParam)) {
      tiersToQuery = [tierParam];
    } else {
      tiersToQuery = allowedTiers;
    }

    const where = {
      status: 'active',
      ...(type ? { type } : {}),
      tier: { in: tiersToQuery },
    };

    const opportunities = await db.opportunity.findMany({
      where,
      orderBy: { reward: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        tier: true,
        category: true,
        reward: true,
        estimatedMinutes: true,
      },
    });

    // Tier breakdown counts
    const tierBreakdown: Record<string, { tasks: number; surveys: number }> = {};
    for (const t of allowedTiers) {
      const [tasks, surveys] = await Promise.all([
        db.opportunity.count({ where: { status: 'active', tier: t, type: 'TASK' } }),
        db.opportunity.count({ where: { status: 'active', tier: t, type: 'SURVEY' } }),
      ]);
      tierBreakdown[t] = { tasks, surveys };
    }

    return NextResponse.json({
      opportunities,
      tierBreakdown,
      userTier: user.tier,
      userActivated: user.isActivated,
    });
  } catch (err) {
    console.error('[opportunities/list] error:', err);
    return NextResponse.json({ error: 'Failed to load opportunities' }, { status: 500 });
  }
}
