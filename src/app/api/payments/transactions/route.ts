import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') || 100), 500);
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json({ transactions });
  } catch (err) {
    console.error('[transactions] error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
