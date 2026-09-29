"use client";

import { DashboardShell, useMe } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Wallet, Users, Sparkles, TrendingUp, ArrowDownToLine, ArrowUpFromLine,
  Gift, PlayCircle, ListChecks, Trophy, Target, Flame,
} from "lucide-react";
import { useEffect, useState } from "react";

const DAILY_GOAL = 100; // KES daily earnings goal

export default function DashboardPage() {
  const { me, reload } = useMe();
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    reload();
    fetch("/api/payments/transactions?limit=5").then(r => r.json()).then(d => setRecent(d.transactions || [])).catch(() => {});
  }, [reload]);

  if (!me) return <DashboardShell><div className="text-muted-foreground">Loading...</div></DashboardShell>;

  const todayEarned = me.todayEarned || 0;
  const goalPercent = Math.min(100, Math.round((todayEarned / DAILY_GOAL) * 100));
  const refBonusEarned = me.verifiedReferrals * 10;

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, <span className="gradient-text">{me.username}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            You've earned <span className="text-amber-400 font-semibold">{todayEarned.toLocaleString()} KES</span> today. Keep going!
          </p>
        </div>

        {/* Daily goal progress bar */}
        <Card className="glass border-amber-500/20 rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Daily Earnings Goal</p>
                  <p className="text-xs text-muted-foreground">Target: {DAILY_GOAL} KES / day</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-400">{todayEarned.toLocaleString()} KES</p>
                <p className="text-xs text-muted-foreground">{goalPercent}% of goal</p>
              </div>
            </div>
            <Progress value={goalPercent} className="h-2 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-400" />
            <p className="text-xs text-muted-foreground mt-2">
              {goalPercent >= 100 ? "🎉 You hit today's goal! Earnings continue — withdraw anytime." : `${DAILY_GOAL - todayEarned} KES more to reach your daily goal.`}
            </p>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <EarningsCard
            label="Available Balance"
            value={`${me.balance.toLocaleString()} KES`}
            sublabel="Ready to withdraw"
            icon={Wallet}
            tone="emerald"
          />
          <EarningsCard
            label="Today's Earnings"
            value={`${todayEarned.toLocaleString()} KES`}
            sublabel={`${me.adsWatchedToday || 0} ads · ? tasks`}
            icon={Sparkles}
            tone="amber"
          />
          <EarningsCard
            label="Total Earned"
            value={`${me.totalEarned.toLocaleString()} KES`}
            sublabel={`Lifetime`}
            icon={Trophy}
            tone="cyan"
          />
          <EarningsCard
            label="Tasks Completed"
            value={String(me.tasksCompleted)}
            sublabel={`${me.referralCount} referrals`}
            icon={ListChecks}
            tone="slate"
          />
        </div>

        {/* Quick action — prominent earn buttons */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Button asChild size="lg" className="h-auto py-6 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 glow">
            <Link href="/dashboard/tasks">
              <ListChecks className="w-5 h-5 mr-2" />
              <div className="flex flex-col items-start text-left">
                <span className="font-bold">Complete Tasks & Surveys</span>
                <span className="text-xs opacity-90">Earn 8–35 KES per task</span>
              </div>
            </Link>
          </Button>
          <Button asChild size="lg" className="h-auto py-6 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 hover:from-cyan-400 hover:to-cyan-500">
            <Link href="/dashboard/ads">
              <PlayCircle className="w-5 h-5 mr-2" />
              <div className="flex flex-col items-start text-left">
                <span className="font-bold">Watch Ads</span>
                <span className="text-xs opacity-90">Earn 2 KES per ad · {15 - (me.adsWatchedToday || 0)} left today</span>
              </div>
            </Link>
          </Button>
        </div>

        {/* Two-column: referral + transactions */}
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Referral spotlight */}
          <Card className="glass border-emerald-500/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-emerald-400" />
                </div>
                Referral Program
              </CardTitle>
              <CardDescription>Earn 10 KES for every friend who activates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-emerald-400">{me.referralCount}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Referrals</div>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-cyan-400">{me.verifiedReferrals}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</div>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-amber-400">{refBonusEarned}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Bonus KES</div>
                </div>
              </div>
              <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20 font-mono text-xs">
                /auth/register?ref={me.referralCode}
              </div>
              <Button asChild variant="outline" size="sm" className="w-full glass">
                <Link href="/dashboard/profile">Manage referral link →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card className="glass border-white/5 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Recent earnings</CardTitle>
              <CardDescription>Your last 5 wallet movements</CardDescription>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No earnings yet.</p>
                  <p className="text-xs">Complete a task to start earning!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-xl glass">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.direction === "CREDIT" ? "bg-emerald-500/15 text-emerald-400" : "bg-cyan-500/15 text-cyan-400"}`}>
                          {tx.type === "TASK_REWARD" ? <ListChecks className="w-4 h-4" /> : 
                           tx.type === "AD_REWARD" ? <PlayCircle className="w-4 h-4" /> :
                           tx.type === "REFERRAL_BONUS" ? <Gift className="w-4 h-4" /> : 
                           tx.type === "WITHDRAWAL" ? <ArrowUpFromLine className="w-4 h-4" /> :
                           tx.type === "DEPOSIT" ? <ArrowDownToLine className="w-4 h-4" /> :
                           <TrendingUp className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[160px]">{tx.description || tx.type.replace(/_/g, ' ').toLowerCase()}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${tx.direction === "CREDIT" ? "text-emerald-400" : "text-cyan-400"}`}>
                          {tx.direction === "CREDIT" ? "+" : "−"} {tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase">{tx.status}</p>
                      </div>
                    </div>
                  ))}
                  <Button asChild variant="ghost" size="sm" className="w-full mt-1">
                    <Link href="/dashboard/transactions">View all →</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function EarningsCard({ label, value, sublabel, icon: Icon, tone }: { label: string; value: string; sublabel?: string; icon: any; tone: "emerald" | "cyan" | "amber" | "slate" }) {
  const toneClass = tone === "emerald" ? "from-emerald-500/20 to-emerald-500/5 text-emerald-400" 
    : tone === "cyan" ? "from-cyan-500/20 to-cyan-500/5 text-cyan-400"
    : tone === "amber" ? "from-amber-500/20 to-amber-500/5 text-amber-400"
    : "from-slate-500/20 to-slate-500/5 text-slate-300";
  return (
    <Card className="glass border-white/5 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sublabel && <p className="text-[11px] text-muted-foreground mt-1">{sublabel}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${toneClass} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
