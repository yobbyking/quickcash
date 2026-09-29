import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const DAILY_AD_CAP = 15;          // max ads per day per user
const REWARD_PER_AD = 2;          // KES
const DURATION_SECONDS = 15;      // minimum watch time before reward

// Pool of simulated ad creatives (in production: Google AdMob / AdSense)
const AD_POOL = [
  { id: 'ad_safaricom_postpay', title: 'Safaricom Postpay — Switch & Save', body: 'Unlimited calls, 100GB data, from KES 1,000/month. Dial *544#.', brand: 'Safaricom', color: '#22c55e' },
  { id: 'ad_jumia_blackfriday', title: 'Jumia Black Friday — Up to 80% OFF', body: 'Shop the biggest sale of the year. Free delivery on orders above KES 1,500.', brand: 'Jumia', color: '#f97316' },
  { id: 'ad_tala_loan', title: 'Tala — Instant Loans to M-Pesa', body: 'Get a loan up to KES 50,000 in 60 seconds. No paperwork, no guarantor.', brand: 'Tala', color: '#3b82f6' },
  { id: 'ad_branch_loan', title: 'Branch — Loans that grow with you', body: 'Apply in 2 minutes. Receive money directly to M-Pesa or bank.', brand: 'Branch', color: '#06b6d4' },
  { id: 'ad_showmax', title: 'Showmax Premier — Stream La Liga Live', body: 'Watch every La Liga match live. KES 500/month, cancel anytime.', brand: 'Showmax', color: '#ec4899' },
  { id: 'ad_naivas', title: 'Naivas — Fresh groceries, online & fast', body: 'Order before 3pm, get same-day delivery in Nairobi.', brand: 'Naivas', color: '#16a34a' },
  { id: 'ad_d-light_solar', title: 'd.light — Solar for every home', body: 'Light up your home for KES 50/week. No more blackouts.', brand: 'd.light', color: '#f59e0b' },
  { id: 'ad_kcb_bank', title: 'KCB Bank — Open account on WhatsApp', body: 'Get a bank account in 5 minutes. No branch visits.', brand: 'KCB', color: '#0ea5e9' },
  { id: 'ad_betika', title: 'Betika — Bet on SportPesa jackpot', body: 'Bet KES 49, win KES 100M. Over 18 only. Play responsibly.', brand: 'Betika', color: '#dc2626' },
  { id: 'ad_tiktok_shop', title: 'TikTok Shop — Sell & Earn from your videos', body: 'Reach 1B+ users. Set up shop in 2 minutes.', brand: 'TikTok', color: '#ec4899' },
  { id: 'ad_glovo', title: 'Glovo — Anything you want, delivered', body: 'Order food, groceries, pharmacy. 30-min delivery in Nairobi.', brand: 'Glovo', color: '#facc15' },
  { id: 'ad_little_ride', title: 'Little Ride — Cheaper than boda', body: 'Book a ride for KES 50 first trip. Promo: SWIFT50.', brand: 'Little', color: '#a855f7' },
];

function getDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Serve a fresh ad to the user. Returns ad metadata + how many ads they have left today.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const u = await db.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!u.isVerified) return NextResponse.json({ error: 'Account not verified' }, { status: 403 });

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
      return NextResponse.json({
        capReached: true,
        cap: DAILY_AD_CAP,
        watched: adsWatchedToday,
        message: `You've reached today's ad limit (${DAILY_AD_CAP} ads). Come back tomorrow!`,
      });
    }

    // Pick a random ad from the pool (avoid showing same one twice in a row if possible)
    const recentWatches = await db.adWatch.findMany({
      where: { userId: user.id },
      orderBy: { watchedAt: 'desc' },
      take: 3,
      select: { adId: true },
    });
    const recentIds = new Set(recentWatches.map(w => w.adId));
    const candidates = AD_POOL.filter(a => !recentIds.has(a.id));
    const pool = candidates.length > 0 ? candidates : AD_POOL;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    return NextResponse.json({
      ad: {
        id: chosen.id,
        title: chosen.title,
        body: chosen.body,
        brand: chosen.brand,
        color: chosen.color,
        durationSec: DURATION_SECONDS,
      },
      reward: REWARD_PER_AD,
      watched: adsWatchedToday,
      cap: DAILY_AD_CAP,
      remaining: DAILY_AD_CAP - adsWatchedToday,
    });
  } catch (err) {
    console.error('[ads/serve] error:', err);
    return NextResponse.json({ error: 'Failed to serve ad' }, { status: 500 });
  }
}
