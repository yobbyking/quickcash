'use client';

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Zap, Wallet, ArrowRight, Users, Shield, Trophy,
  TrendingUp, Star, CheckCircle2, Clock, Target, Crown, Flame,
} from "lucide-react";

const TIERS = [
  {
    name: 'Silver', icon: Trophy, badge: 'Starter', tone: 'slate',
    reward: 'KES 30 – 80', fee: 199, perks: ['Consumer Surveys', 'Product Feedback', 'Data Entry'],
  },
  {
    name: 'Gold', icon: Crown, badge: 'Popular', tone: 'amber',
    reward: 'KES 100 – 250', fee: 299, perks: ['All Silver +', 'Business Surveys', 'Market Research', 'Brand Reviews'],
  },
  {
    name: 'VIP', icon: Sparkles, badge: 'Premium', tone: 'violet',
    reward: 'KES 300 – 800', fee: 399, perks: ['All Gold +', 'Strategic Analysis', 'Premium Surveys', 'Priority Access'],
  },
];

export default function Home() {
  const { appUser, signOut } = useAuth();
  const dashboardHref = appUser ? (appUser.isActivated ? '/dashboard' : '/auth/activate') : '/auth/login';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 glass">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/40">
              Q
            </div>
            <span className="text-lg font-bold tracking-tight">QuickCash</span>
            <Badge className="ml-2 bg-amber-500/15 text-amber-300 border-amber-500/30 hidden sm:inline-flex">
              <Sparkles className="w-3 h-3 mr-1" /> Earn Real KES
            </Badge>
          </div>
          <nav className="flex items-center gap-2">
            {appUser ? (
              <>
                <Button asChild size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400">
                  <Link href={dashboardHref}>
                    {appUser.isActivated ? 'Dashboard' : 'Activate Account'}
                    <ArrowRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost"><Link href="/auth/login">Log In</Link></Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400">
                  <Link href="/auth/register">
                    Sign Up Free <ArrowRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center space-y-6 mb-16">
          <Badge variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-500/10">
            <Star className="w-3 h-3 mr-1.5 fill-amber-400" /> Trusted by 12,000+ Kenyans · KES 48M+ Paid Out · 96% Satisfaction
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Complete tasks. <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">Earn real KES.</span><br />
            Instant M-Pesa withdrawal.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sign up in 30 seconds. Choose your tier, complete real-opinion surveys and tasks,
            and watch your balance grow. Withdraw directly to M-Pesa whenever you want.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="h-14 px-8 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 text-base font-semibold glow">
              <Link href="/auth/register">
                Start Earning Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 glass text-base">
              <Link href="/auth/login">I already have an account</Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8">
            <StatCard label="Paid Out" value="KES 48M+" tone="amber" />
            <StatCard label="Members" value="12,000+" tone="emerald" />
            <StatCard label="Satisfaction" value="96%" tone="cyan" />
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { num: 1, icon: Users, title: 'Create Account', desc: 'Sign up with Google or email — pick your username, phone, and tier. Takes 30 seconds.' },
              { num: 2, icon: Zap, title: 'Activate Tier', desc: 'One-time activation fee via M-Pesa STK push. Silver KES 199, Gold KES 299, VIP KES 399.' },
              { num: 3, icon: Target, title: 'Complete Tasks', desc: 'Browse 161+ tasks and surveys. Answer questions one at a time. Each completed task adds real money to your balance.' },
              { num: 4, icon: Wallet, title: 'Withdraw Instantly', desc: 'Send your balance to M-Pesa via B2C payout. Money arrives in 1-2 minutes.' },
            ].map(step => (
              <Card key={step.num} className="glass border-white/5 rounded-2xl relative">
                <CardContent className="p-5">
                  <div className="absolute top-4 right-4 text-4xl font-bold text-white/5">{step.num}</div>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 flex items-center justify-center mb-3">
                    <step.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tiers */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Earning Tiers</h2>
            <p className="text-muted-foreground">Pick the tier that fits your earning ambition.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((tier, i) => (
              <Card
                key={tier.name}
                className={`glass ${i === 1 ? 'border-amber-500/40 glow' : 'border-white/5'} rounded-3xl relative overflow-hidden`}
              >
                {i === 1 && (
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold rounded-bl-2xl">
                    POPULAR
                  </div>
                )}
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.tone === 'amber' ? 'from-amber-500/30 to-amber-500/10' : tier.tone === 'violet' ? 'from-violet-500/30 to-violet-500/10' : 'from-slate-500/30 to-slate-500/10'} flex items-center justify-center mb-4`}>
                    <tier.icon className={`w-7 h-7 ${tier.tone === 'amber' ? 'text-amber-400' : tier.tone === 'violet' ? 'text-violet-400' : 'text-slate-300'}`} />
                  </div>
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-2xl font-bold">{tier.name} Tier</h3>
                    <Badge variant="outline" className={`${tier.tone === 'amber' ? 'border-amber-500/40 text-amber-300' : tier.tone === 'violet' ? 'border-violet-500/40 text-violet-300' : 'border-slate-500/40 text-slate-300'}`}>
                      {tier.badge}
                    </Badge>
                  </div>
                  <p className="text-3xl font-extrabold mb-1">{tier.reward}<span className="text-sm font-normal text-muted-foreground">/task</span></p>
                  <p className="text-sm text-muted-foreground mb-4">Activation: <span className="font-semibold text-amber-400">KES {tier.fee}</span></p>
                  <ul className="space-y-2 mb-5">
                    {tier.perks.map(p => (
                      <li key={p} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="sm" className={`w-full ${tier.tone === 'amber' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950' : tier.tone === 'violet' ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white' : 'glass'}`}>
                    <Link href={`/auth/register?tier=${tier.name.toLowerCase()}`}>
                      Choose {tier.name} <ArrowRight className="ml-1 w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          <FeatureCard icon={Shield} title="Bank-Grade Security" desc="Firebase Authentication + Google SSO. Your data is encrypted and never shared." />
          <FeatureCard icon={Zap} title="Instant M-Pesa" desc="STK push activation + B2C withdrawals. Money lands in your M-Pesa in 1-2 minutes." />
          <FeatureCard icon={Users} title="Referral Rewards" desc="Earn 10 KES for every friend who activates. Build passive income." />
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to start earning?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create your free account, pick your tier, complete your first task in under 5 minutes.
          </p>
          <Button asChild size="lg" className="h-14 px-8 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 text-base font-semibold glow">
            <Link href="/auth/register">
              Sign Up Free — Get KES 50 bonus <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="glass border-t border-white/5 mt-auto">
        <div className="container mx-auto max-w-6xl px-4 py-8 text-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950 text-sm">Q</div>
              <span className="font-medium">QuickCash</span>
              <span className="text-muted-foreground">· © 2026</span>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground text-xs">
              <Link href="#">Terms</Link>
              <Link href="#">Privacy</Link>
              <Link href="#">Help</Link>
              <Link href="#">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'emerald' | 'cyan' }) {
  const toneClass = tone === 'amber' ? 'from-amber-500/20 to-amber-500/5 text-amber-400'
    : tone === 'emerald' ? 'from-emerald-500/20 to-emerald-500/5 text-emerald-400'
    : 'from-cyan-500/20 to-cyan-500/5 text-cyan-400';
  return (
    <Card className="glass border-white/5 rounded-2xl">
      <CardContent className="p-5 text-center">
        <div className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${toneClass} items-center justify-center mb-2`}>
          <TrendingUp className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="glass border-white/5 rounded-2xl">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}
