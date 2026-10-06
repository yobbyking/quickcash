import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/opportunities/detail?id=<id>
 * Returns full opportunity details including all questions.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const opp = await db.opportunity.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { questionOrder: 'asc' } },
      },
    });
    if (!opp || opp.status !== 'active') {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Tier access check
    const tierOrder = { silver: ['silver'], gold: ['silver', 'gold'], vip: ['silver', 'gold', 'vip'] };
    const allowedTiers = tierOrder[user.tier as keyof typeof tierOrder] || ['silver'];
    if (!allowedTiers.includes(opp.tier)) {
      return NextResponse.json({ error: 'Your tier does not have access to this opportunity' }, { status: 403 });
    }

    // Check if user already has a pending or completed attempt
    const existing = await db.completion.findFirst({
      where: { userId: user.id, opportunityId: id, status: { in: ['pending', 'completed'] } },
    });

    return NextResponse.json({
      opportunity: {
        ...opp,
        questions: opp.questions.map(q => ({
          ...q,
          options: q.options ? JSON.parse(q.options) : [],
        })),
      },
      alreadyCompleted: existing?.status === 'completed',
      hasPending: existing?.status === 'pending',
    });
  } catch (err) {
    console.error('[opportunities/detail] error:', err);
    return NextResponse.json({ error: 'Failed to load opportunity' }, { status: 500 });
  }
}
