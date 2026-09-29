import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Zap, Wallet, ArrowRight, Users, Lock, Smartphone, CheckCircle2,
  ListChecks, PlayCircle, Sparkles, Trophy, Flame, Clock,
} from "lucide-react";

const BCLB = process.env.NEXT_PUBLIC_BCLB_NUMBER || "7YGEB3OD";
const ACTIVATION_FEE = process.env.NEXT_PUBLIC_ACTIVATION_FEE || "150";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 glass">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Logo size={36} withText />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400">
              <Link href="/auth/register">
                Start Earning
                <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-500/10">
              <Sparkles className="w-3 h-3 mr-1.5" /> Tasks · Ads · Referrals — Earn Real KES
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Get paid to <span className="gradient-text">answer, watch &amp; refer</span>.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              Complete surveys, watch sponsored ads, and invite friends — earn real KES straight to your M-Pesa.
              Activate your account once with {ACTIVATION_FEE} KES and start earning immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 glow">
                <Link href="/auth/register">
                  Start earning now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass">
                <Link href="/auth/login">I already have an account</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Bank-grade security
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                M-Pesa native
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                BCLB: {BCLB}
              </div>
            </div>
          </div>

          {/* Showcase — Earnings dashboard mockup */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 via-transparent to-cyan-500/20 rounded-3xl blur-2xl" />
            <Card className="relative glass-strong gradient-border rounded-3xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Logo size={32} />
                    <span className="font-semibold">SwiftPay Wallet</span>
                  </div>
                  <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse mr-1.5" />
                    EARNING
                  </Badge>
                </div>

                {/* Daily goal */}
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Today's earnings</span>
                    <span className="text-xs text-amber-400 font-mono">68% of goal</span>
                  </div>
                  <p className="text-3xl font-bold gradient-text">KES 68<span className="text-xl text-muted-foreground"> / 100 goal</span></p>
                  <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: '68%' }} />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="glass rounded-xl p-3 text-center">
                    <ListChecks className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-base font-bold">12</p>
                    <p className="text-[10px] text-muted-foreground">Tasks</p>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <PlayCircle className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <p className="text-base font-bold">7</p>
                    <p className="text-[10px] text-muted-foreground">Ads</p>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <Users className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-base font-bold">3</p>
                    <p className="text-[10px] text-muted-foreground">Refs</p>
                  </div>
                </div>

                {/* Recent earnings */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5 text-emerald-400" /> Survey: Brand Preference</span>
                    <span className="font-semibold text-emerald-400">+25 KES</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5 text-cyan-400" /> Ad: Tala Instant Loans</span>
                    <span className="font-semibold text-cyan-400">+2 KES</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-amber-400" /> Referral bonus: jamal1</span>
                    <span className="font-semibold text-amber-400">+10 KES</span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground text-center pt-2 border-t border-white/5">
                  BCLB No. {BCLB} · Regulated by Betting Control & Licensing Board
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3 ways to earn */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Three ways to <span className="gradient-text">earn</span></h2>
            <p className="text-muted-foreground mt-2">Pick your favorite — or do all three.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <EarnCard
              icon={ListChecks}
              tone="emerald"
              title="Complete Tasks & Surveys"
              desc="Answer short surveys, vote in polls, share your opinions. Each task pays 8–35 KES instantly to your balance."
              payout="8–35 KES per task"
            />
            <EarnCard
              icon={PlayCircle}
              tone="cyan"
              title="Watch Sponsored Ads"
              desc="Watch 15-second ads from Kenyan brands. Earn 2 KES per ad, up to 15 ads per day — that's 30 KES daily on autopilot."
              payout="2 KES per ad · 30 KES daily max"
            />
            <EarnCard
              icon={Users}
              tone="amber"
              title="Refer & Earn"
              desc="Share your unique link. Each friend who activates their account earns you 10 KES — instantly, every time."
              payout="10 KES per referral"
            />
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <StepCard num={1} icon={Smartphone} title="Register" desc="Sign up with email, username, M-Pesa phone, password." />
            <StepCard num={2} icon={Zap} title="Activate" desc={`One-time ${ACTIVATION_FEE} KES M-Pesa STK push to unlock earning.`} />
            <StepCard num={3} icon={Trophy} title="Earn" desc="Complete tasks, watch ads, refer friends — KES lands instantly." />
            <StepCard num={4} icon={Wallet} title="Withdraw" desc="Send your balance to M-Pesa anytime via B2C payout." />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to <span className="gradient-text">start earning</span>?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Activate your account with a one-time {ACTIVATION_FEE} KES M-Pesa payment. No subscription, no monthly fees.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 glow">
            <Link href="/auth/register">
              Start now — pay only {ACTIVATION_FEE} KES
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/5 mt-auto">
        <div className="container mx-auto max-w-6xl px-4 py-8 text-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="font-medium">SwiftPay</span>
              <span className="text-muted-foreground">· © 2026</span>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground">
              <span>BCLB No. <span className="text-foreground font-mono">{BCLB}</span></span>
              <span>Powered by SwiftWallet v3</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EarnCard({ icon: Icon, tone, title, desc, payout }: { icon: any; tone: "emerald" | "cyan" | "amber"; title: string; desc: string; payout: string }) {
  const toneClass = tone === "emerald" ? "from-emerald-500/20 to-emerald-500/5 text-emerald-400"
    : tone === "cyan" ? "from-cyan-500/20 to-cyan-500/5 text-cyan-400"
    : "from-amber-500/20 to-amber-500/5 text-amber-400";
  return (
    <Card className="glass border-white/5 rounded-2xl">
      <CardContent className="p-6">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${toneClass} flex items-center justify-center mb-4`}>
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{desc}</p>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs font-mono">
          <Trophy className="w-3 h-3 text-amber-400" />
          {payout}
        </div>
      </CardContent>
    </Card>
  );
}

function StepCard({ num, icon: Icon, title, desc }: { num: number; icon: any; title: string; desc: string }) {
  return (
    <Card className="glass border-white/5 rounded-2xl relative">
      <CardContent className="p-5">
        <div className="absolute top-4 right-4 text-3xl font-bold text-white/5">{num}</div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
