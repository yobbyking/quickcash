import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const DAILY_AD_CAP = 15;
const REWARD_PER_AD = 2;
const MIN_DURATION_SEC = 15;

const RewardSchema = z.object({
  adId: z.string(),
  adTitle: z.string(),
  durationSec: z.number().min(MIN_DURATION_SEC),
});

function getDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Claim reward after watching an ad. Validates:
 *  - User is verified
 *  - Daily cap not exceeded
 *  - Duration is sufficient
 *  - Anti-fraud: at most 1 ad reward per 10 seconds (no rapid spamming)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const u = await db.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!u.isVerified) return NextResponse.json({ error: 'Account not verified' }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const parsed = RewardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    const { adId, adTitle, durationSec } = parsed.data;

    // Reset daily counter if new day
    const today = getDayKey();
    let adsWatchedToday = u.adsWatchedToday;
    if (u.lastAdDay !== today) {
      adsWatchedToday = 0;
      await db.user.update({
        where: { id: u.id },
        data: { adsWatchedToday: 0, lastAdDay: today },
      });
    }

    if (adsWatchedToday >= DAILY_AD_CAP) {
      return NextResponse.json({ error: `Daily ad cap (${DAILY_AD_CAP}) reached. Come back tomorrow.` }, { status: 429 });
    }

    // Anti-fraud: at most 1 reward per 10 seconds (prevents client-side spam)
    const lastReward = await db.adWatch.findFirst({
      where: { userId: user.id },
      orderBy: { watchedAt: 'desc' },
    });
    if (lastReward) {
      const elapsed = (Date.now() - lastReward.watchedAt.getTime()) / 1000;
      if (elapsed < 10) {
        return NextResponse.json({
          error: `Please wait ${Math.ceil(10 - elapsed)}s before watching the next ad.`,
        }, { status: 429 });
      }
    }

    // Record ad watch
    const watch = await db.adWatch.create({
      data: {
        userId: user.id,
        adId,
        adTitle,
        reward: REWARD_PER_AD,
        durationSec,
        status: 'COMPLETED',
      },
    });

    // Credit user + bump counters
    await db.user.update({
      where: { id: user.id },
      data: {
        balance: { increment: REWARD_PER_AD },
        totalEarned: { increment: REWARD_PER_AD },
        adsWatchedToday: { increment: 1 },
        adsWatchedTotal: { increment: 1 },
      },
    });

    // Transaction record
    await db.transaction.create({
      data: {
        userId: user.id,
        type: 'AD_REWARD',
        amount: REWARD_PER_AD,
        direction: 'CREDIT',
        status: 'COMPLETED',
        reference: `AD${Date.now()}${Math.floor(Math.random() * 1000)}`,
        description: `Ad reward: ${adTitle}`,
        relatedAdWatchId: watch.id,
      },
    });

    return NextResponse.json({
      reward: REWARD_PER_AD,
      totalEarnedToday: adsWatchedToday + 1,
      cap: DAILY_AD_CAP,
      remaining: DAILY_AD_CAP - adsWatchedToday - 1,
      message: `Ad watched! +${REWARD_PER_AD} KES credited to your balance.`,
    });
  } catch (err) {
    console.error('[ads/reward] error:', err);
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
  }
}
