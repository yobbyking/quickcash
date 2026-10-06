import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * POST /api/opportunities/start
 * Body: { opportunityId }
 * Creates a "pending" Completion record for this user + opportunity.
 * If already pending, returns the existing one. If already completed, returns 409.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!user.isActivated) {
      return NextResponse.json({ error: 'Activate your account first to start tasks', needsActivation: true }, { status: 403 });
    }

    const { opportunityId } = await req.json();
    if (!opportunityId) return NextResponse.json({ error: 'opportunityId required' }, { status: 400 });

    const opp = await db.opportunity.findUnique({
      where: { id: opportunityId },
      include: { questions: { orderBy: { questionOrder: 'asc' } } },
    });
    if (!opp || opp.status !== 'active') {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Tier access check
    const tierOrder = { silver: ['silver'], gold: ['silver', 'gold'], vip: ['silver', 'gold', 'vip'] };
    const allowedTiers = tierOrder[user.tier as keyof typeof tierOrder] || ['silver'];
    if (!allowedTiers.includes(opp.tier)) {
      return NextResponse.json({ error: 'Your tier does not have access' }, { status: 403 });
    }

    // Check existing
    const existing = await db.completion.findFirst({
      where: { userId: user.id, opportunityId, status: { in: ['pending', 'completed'] } },
    });
    if (existing?.status === 'completed') {
      return NextResponse.json({ error: 'You already completed this opportunity' }, { status: 409 });
    }

    let completion = existing;
    if (!completion) {
      completion = await db.completion.create({
        data: {
          userId: user.id,
          opportunityId,
          status: 'pending',
        },
      });
    }

    return NextResponse.json({
      completion: {
        id: completion.id,
        status: completion.status,
        startedAt: completion.startedAt,
      },
      opportunity: {
        id: opp.id,
        title: opp.title,
        reward: opp.reward,
        estimatedMinutes: opp.estimatedMinutes,
        questions: opp.questions.map(q => ({
          id: q.id,
          questionOrder: q.questionOrder,
          text: q.text,
          answerType: q.answerType,
          options: q.options ? JSON.parse(q.options) : [],
          required: q.required,
        })),
      },
    });
  } catch (err) {
    console.error('[opportunities/start] error:', err);
    return NextResponse.json({ error: 'Failed to start' }, { status: 500 });
  }
}
