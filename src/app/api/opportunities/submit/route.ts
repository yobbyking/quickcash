import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const SubmitSchema = z.object({
  completionId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    value: z.string(),  // for multi-select, JSON-encoded array as string
  })),
});

/**
 * POST /api/opportunities/submit
 * Body: { completionId, answers: [{ questionId, value }] }
 * Validates all required questions answered, then credits reward + creates transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { completionId, answers } = parsed.data;

    // Get the completion + opportunity + questions
    const completion = await db.completion.findUnique({
      where: { id: completionId },
      include: {
        opportunity: { include: { questions: true } },
      },
    });
    if (!completion || completion.userId !== user.id) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 });
    }
    if (completion.status === 'completed') {
      return NextResponse.json({ error: 'Already completed' }, { status: 409 });
    }

    // Validate all required questions are answered
    const requiredQuestions = completion.opportunity.questions.filter(q => q.required);
    const answeredIds = new Set(answers.map(a => a.questionId));
    for (const q of requiredQuestions) {
      if (!answeredIds.has(q.id)) {
        return NextResponse.json({
          error: `Missing answer for required question: ${q.text}`,
          questionId: q.id,
        }, { status: 400 });
      }
      // Check the answer value isn't empty
      const ans = answers.find(a => a.questionId === q.id);
      if (!ans.value || (typeof ans.value === 'string' && !ans.value.trim())) {
        return NextResponse.json({
          error: `Empty answer for required question: ${q.text}`,
          questionId: q.id,
        }, { status: 400 });
      }
    }

    // Save answers + mark completion as completed
    await db.answer.createMany({
      data: answers.map(a => ({
        completionId,
        questionId: a.questionId,
        value: a.value,
      })),
    });

    await db.completion.update({
      where: { id: completionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        reward: completion.opportunity.reward,
      },
    });

    // Credit user balance + bump counters + transaction record
    await db.user.update({
      where: { id: user.id },
      data: {
        balance: { increment: completion.opportunity.reward },
        totalEarned: { increment: completion.opportunity.reward },
        tasksCompleted: { increment: 1 },
      },
    });
    await db.transaction.create({
      data: {
        userId: user.id,
        type: 'TASK_REWARD',
        amount: completion.opportunity.reward,
        direction: 'CREDIT',
        status: 'COMPLETED',
        reference: `TASK${Date.now()}${Math.floor(Math.random() * 1000)}`,
        description: `Task reward: ${completion.opportunity.title}`,
        relatedCompletionId: completionId,
      },
    });

    return NextResponse.json({
      reward: completion.opportunity.reward,
      message: `Opportunity completed! +KES ${completion.opportunity.reward} credited.`,
    });
  } catch (err) {
    console.error('[opportunities/submit] error:', err);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
