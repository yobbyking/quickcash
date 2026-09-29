import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

/**
 * List available tasks for the user, with their attempt history.
 * Hides tasks they've already maxed out on.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const u = await db.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!u.isVerified) return NextResponse.json({ error: 'Account not verified' }, { status: 403 });

    // Get all active tasks
    const tasks = await db.task.findMany({
      where: { isActive: true },
      orderBy: { payout: 'desc' },
    });

    // Get user's attempts
    const attempts = await db.taskAttempt.findMany({
      where: { userId: user.id },
      select: { taskId: true, status: true },
    });
    const attemptMap = new Map<string, string>();
    for (const a of attempts) attemptMap.set(a.taskId, a.status);

    // If taskId query param, return that single task's full details
    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');
    if (taskId) {
      const task = await db.task.findUnique({ where: { id: taskId } });
      if (!task || !task.isActive) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      return NextResponse.json({
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          category: task.category,
          payout: task.payout,
          estimatedMinutes: task.estimatedMinutes,
          questions: task.questions, // raw JSON string
          requiredAnswers: task.requiredAnswers,
          maxAttempts: task.maxAttempts,
        },
      });
    }

    // Filter: only show tasks the user can still do
    const available = tasks
      .map(t => {
        const myStatus = attemptMap.get(t.id);
        const completedCount = attempts.filter(a => a.taskId === t.id && a.status === 'COMPLETED').length;
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          payout: t.payout,
          estimatedMinutes: t.estimatedMinutes,
          requiredAnswers: t.requiredAnswers,
          questionCount: JSON.parse(t.questions).length,
          myStatus: myStatus || null,
          maxAttempts: t.maxAttempts,
          completedCount,
          canDo: completedCount < t.maxAttempts,
        };
      })
      .filter(t => t.canDo);

    return NextResponse.json({
      tasks: available,
      stats: {
        tasksCompleted: u.tasksCompleted,
        totalEarned: u.totalEarned,
        balance: u.balance,
      },
    });
  } catch (err) {
    console.error('[tasks/list] error:', err);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}

/**
 * Admin: seed sample tasks if none exist (dev convenience).
 * POST /api/tasks/list with { seed: true }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (!body?.seed) return NextResponse.json({ error: 'Use GET to list tasks' }, { status: 400 });

    // Only allow seed if no tasks exist yet
    const count = await db.task.count();
    if (count > 0) return NextResponse.json({ message: 'Tasks already seeded', count });

    const samples = [
      {
        title: 'Brand Preference Survey',
        description: 'Tell us about your favorite mobile money brands. 5 quick questions.',
        category: 'SURVEY',
        payout: 25,
        estimatedMinutes: 3,
        requiredAnswers: 1,
        questions: [
          { id: 'q1', text: 'Which mobile money service do you use most?', type: 'radio', options: ['M-Pesa', 'Airtel Money', 'T-Kash', 'Other'] },
          { id: 'q2', text: 'How many mobile money transactions do you make per week?', type: 'radio', options: ['0-5', '6-15', '16-30', '31+'] },
          { id: 'q3', text: 'What do you use most for payments?', type: 'radio', options: ['Bills', 'Airtime', 'Shopping', 'Sending money', 'Business'] },
          { id: 'q4', text: 'Rate M-Pesa customer service (1-5)', type: 'radio', options: ['1', '2', '3', '4', '5'] },
          { id: 'q5', text: 'Would you recommend your main service to a friend?', type: 'radio', options: ['Yes', 'No', 'Maybe'] },
        ],
      },
      {
        title: 'Quick Product Poll',
        description: 'Vote on your favorite feature. 2 questions.',
        category: 'POLL',
        payout: 8,
        estimatedMinutes: 1,
        requiredAnswers: 1,
        questions: [
          { id: 'q1', text: 'Which feature matters most in a wallet app?', type: 'radio', options: ['Fast transfers', 'Low fees', 'Rewards', 'Security', 'Easy UI'] },
          { id: 'q2', text: 'Preferred payout method?', type: 'radio', options: ['M-Pesa', 'Bank transfer', 'Airtime', 'Crypto'] },
        ],
      },
      {
        title: 'Internet Usage Survey',
        description: 'Help us understand your internet habits. 4 questions.',
        category: 'SURVEY',
        payout: 18,
        estimatedMinutes: 2,
        requiredAnswers: 1,
        questions: [
          { id: 'q1', text: 'How many hours/day do you spend online?', type: 'radio', options: ['<1', '1-3', '3-6', '6-12', '12+'] },
          { id: 'q2', text: 'Main device for internet?', type: 'radio', options: ['Smartphone', 'Tablet', 'Laptop', 'Desktop'] },
          { id: 'q3', text: 'Primary online activity?', type: 'radio', options: ['Social media', 'Work', 'Streaming', 'Gaming', 'Learning'] },
          { id: 'q4', text: 'Internet speed satisfaction (1-5)?', type: 'radio', options: ['1', '2', '3', '4', '5'] },
        ],
      },
      {
        title: 'Open Feedback Question',
        description: 'Share your thoughts on how fintech apps can improve in Kenya.',
        category: 'QUESTION',
        payout: 35,
        estimatedMinutes: 5,
        requiredAnswers: 1,
        questions: [
          { id: 'q1', text: 'In 2-3 sentences, what would make you switch from M-Pesa to another wallet?', type: 'text' },
        ],
      },
      {
        title: 'Shopping Habits',
        description: 'Tell us about your monthly shopping. 6 questions.',
        category: 'SURVEY',
        payout: 30,
        estimatedMinutes: 4,
        requiredAnswers: 1,
        questions: [
          { id: 'q1', text: 'Where do you shop most?', type: 'radio', options: ['Supermarket', 'Open-air market', 'Online', 'Mall', 'Kiosk'] },
          { id: 'q2', text: 'Monthly grocery budget (KES)?', type: 'radio', options: ['<2k', '2k-5k', '5k-10k', '10k-20k', '20k+'] },
          { id: 'q3', text: 'Pay method for groceries?', type: 'radio', options: ['Cash', 'M-Pesa', 'Card', 'Mixed'] },
          { id: 'q4', text: 'How often do you shop online?', type: 'radio', options: ['Never', 'Monthly', 'Weekly', 'Daily'] },
          { id: 'q5', text: 'Favorite online store?', type: 'radio', options: ['Jumia', 'Kilimall', 'Jiji', 'Ariel', 'Other'] },
          { id: 'q6', text: 'Quality vs Price — which wins?', type: 'radio', options: ['Quality', 'Price', 'Both equal'] },
        ],
      },
      {
        title: 'Mobile App Experience',
        description: 'Quick poll about your favorite app features.',
        category: 'POLL',
        payout: 12,
        estimatedMinutes: 2,
        requiredAnswers: 1,
        questions: [
          { id: 'q1', text: 'Dark mode or light mode?', type: 'radio', options: ['Dark', 'Light', 'System'] },
          { id: 'q2', text: 'Notifications: too many or just right?', type: 'radio', options: ['Too many', 'Just right', 'Too few'] },
          { id: 'q3', text: 'App you open most daily?', type: 'radio', options: ['WhatsApp', 'TikTok', 'Instagram', 'X', 'YouTube'] },
        ],
      },
      {
        title: 'Entertainment Preferences',
        description: 'Tell us what you watch/listen to.',
        category: 'SURVEY',
        payout: 20,
        estimatedMinutes: 3,
        requiredAnswers: 1,
        questions: [
          { id: 'q1', text: 'Favorite music genre?', type: 'radio', options: ['Genge', 'Afrobeat', 'Gospel', 'Bongo', 'Hip-hop', 'Other'] },
          { id: 'q2', text: 'Streaming platform?', type: 'radio', options: ['YouTube', 'Netflix', 'Showmax', 'None'] },
          { id: 'q3', text: 'Watch hours/week?', type: 'radio', options: ['<3', '3-10', '10-20', '20+'] },
        ],
      },
      {
        title: 'Transport Survey',
        description: 'How do you move around? 4 quick questions.',
        category: 'SURVEY',
        payout: 15,
        estimatedMinutes: 2,
        requiredAnswers: 1,
        questions: [
          { id: 'q1', text: 'Primary mode of transport?', type: 'radio', options: ['Matatu', 'Boda boda', 'Personal car', 'Taxi/Bolt/Uber', 'Walk'] },
          { id: 'q2', text: 'Weekly transport spend (KES)?', type: 'radio', options: ['<200', '200-500', '500-1500', '1500+'] },
          { id: 'q3', text: 'Would you use a ride-share subscription?', type: 'radio', options: ['Yes', 'No', 'Maybe'] },
          { id: 'q4', text: 'Biggest complaint about transport?', type: 'radio', options: ['Cost', 'Safety', 'Time', 'Comfort'] },
        ],
      },
    ];

    for (const t of samples) {
      await db.task.create({
        data: {
          ...t,
          questions: JSON.stringify(t.questions),
          isActive: true,
          maxAttempts: 1,
        },
      });
    }

    return NextResponse.json({ message: 'Seeded sample tasks', count: samples.length });
  } catch (err) {
    console.error('[tasks/seed] error:', err);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
