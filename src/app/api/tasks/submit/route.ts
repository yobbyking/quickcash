import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const SubmitSchema = z.object({
  taskId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    value: z.string().min(1).max(2000),
  })),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const u = await db.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!u.isVerified) return NextResponse.json({ error: 'Account not verified' }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { taskId, answers } = parsed.data;

    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task || !task.isActive) {
      return NextResponse.json({ error: 'Task not available' }, { status: 404 });
    }

    // Check max attempts
    const completed = await db.taskAttempt.count({
      where: { userId: user.id, taskId, status: 'COMPLETED' },
    });
    if (completed >= task.maxAttempts) {
      return NextResponse.json({ error: 'You have already completed this task' }, { status: 409 });
    }

    // Check pending attempt (don't allow duplicates)
    const pending = await db.taskAttempt.findFirst({
      where: { userId: user.id, taskId, status: 'PENDING' },
    });
    if (pending) {
      return NextResponse.json({ error: 'You already have a pending attempt on this task' }, { status: 409 });
    }

    // Validate all required questions answered
    const questions = JSON.parse(task.questions);
    const requiredIds = questions.map((q: any) => q.id);
    const answeredIds = answers.map(a => a.questionId);
    const allAnswered = requiredIds.every((id: string) => answeredIds.includes(id));
    if (!allAnswered) {
      return NextResponse.json({ error: 'Please answer all questions' }, { status: 400 });
    }

    // Create attempt + reward (instant reward — survey logic simplified)
    const attempt = await db.taskAttempt.create({
      data: {
        userId: user.id,
        taskId,
        status: 'COMPLETED',
        answers: JSON.stringify(answers),
        reward: task.payout,
        completedAt: new Date(),
      },
    });

    // Credit user
    await db.user.update({
      where: { id: user.id },
      data: {
        balance: { increment: task.payout },
        totalEarned: { increment: task.payout },
        tasksCompleted: { increment: 1 },
      },
    });

    // Transaction record
    await db.transaction.create({
      data: {
        userId: user.id,
        type: 'TASK_REWARD',
        amount: task.payout,
        direction: 'CREDIT',
        status: 'COMPLETED',
        reference: `TASK${Date.now()}${Math.floor(Math.random() * 1000)}`,
        description: `Task reward: ${task.title}`,
        relatedTaskId: attempt.id,
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      reward: task.payout,
      message: `Task completed! You earned ${task.payout} KES.`,
    });
  } catch (err) {
    console.error('[tasks/submit] error:', err);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
