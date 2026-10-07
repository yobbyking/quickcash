"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Sparkles, Zap, Wallet, ArrowRight, Users, Shield, Trophy,
  TrendingUp, Star, CheckCircle2, Crown, Flame, Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TIERS = [
  {
    name: 'Silver', icon: Trophy, badge: 'STARTER',
    reward: 'KES 30 – 80', fee: 199,
    perks: ['Consumer Surveys', 'Product Feedback', 'Data Entry'],
    glow: 'from-slate-500/20 to-slate-700/5',
    border: 'border-slate-500/20',
    iconColor: 'text-slate-300',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  },
  {
    name: 'Gold', icon: Crown, badge: 'POPULAR',
    reward: 'KES 100 – 250', fee: 299,
    perks: ['All Silver +', 'Business Surveys', 'Market Research', 'Brand Reviews'],
    glow: 'from-amber-500/30 to-orange-500/10',
    border: 'border-amber-500/40',
    iconColor: 'text-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    name: 'VIP', icon: Sparkles, badge: 'PREMIUM',
    reward: 'KES 300 – 800', fee: 399,
    perks: ['All Gold +', 'Strategic Analysis', 'Premium Surveys', 'Priority Access'],
    glow: 'from-violet-500/30 to-purple-500/10',
    border: 'border-violet-500/40',
    iconColor: 'text-violet-400',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  },
];

export default function Home() {
  const { appUser, signOut } = useAuth();
  const dashboardHref = appUser ? (appUser.isActivated ? '/dashboard' : '/auth/activate') : '/auth/login';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/40">
              Q
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 opacity-30 blur-sm" />
            </div>
            <span className="text-lg font-bold tracking-tight">QuickCash</span>
            <Badge className="ml-2 bg-amber-500/15 text-amber-300 border-amber-500/30 hidden sm:inline-flex">
              <Sparkles className="w-3 h-3 mr-1" /> Earn Real KES
            </Badge>
          </div>
          <nav className="flex items-center gap-2">
            {appUser ? (
              <>
                <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">Sign out</button>
                <Link href={dashboardHref} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-sm font-semibold hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/30">
                  {appUser.isActivated ? 'Dashboard' : 'Activate'} <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">Sign in</Link>
                <Link href="/auth/register" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-sm font-semibold hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/30">
                  Sign Up Free <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-12 md:py-20 relative z-10">
        {/* Hero section */}
        <div className="text-center space-y-8 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <Star className="w-3 h-3 fill-amber-400" />
            Trusted by 12,000+ Kenyans · KES 48M+ Paid Out · 96% Satisfaction
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Complete tasks.
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Earn real KES.
            </span>
            <br />
            Instant M-Pesa withdrawal.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sign up in 30 seconds. Choose your tier, complete real-opinion surveys and tasks,
            and watch your balance grow. Withdraw directly to M-Pesa whenever you want.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/auth/register" className="flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-slate-950 text-base font-bold hover:from-amber-400 hover:via-orange-400 hover:to-red-400 glow transition-all shadow-xl shadow-amber-500/30">
              Start Earning Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/login" className="flex items-center justify-center gap-2 h-14 px-8 rounded-2xl glass border border-white/10 text-base font-medium hover:bg-white/10 transition-all">
              I already have an account
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-12">
            <div className="glass rounded-2xl p-5 text-center border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold">KES 48M+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Paid Out</p>
            </div>
            <div className="glass rounded-2xl p-5 text-center border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold">12,000+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Members</p>
            </div>
            <div className="glass rounded-2xl p-5 text-center border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mx-auto mb-2">
                <Star className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold">96%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Satisfaction</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { num: 1, icon: Users, title: 'Create Account', desc: 'Sign up with Google or email — pick your username, phone, and tier. Takes 30 seconds.' },
              { num: 2, icon: Zap, title: 'Activate Tier', desc: 'One-time activation fee via M-Pesa STK push. Silver KES 199, Gold KES 299, VIP KES 399.' },
              { num: 3, icon: Target, title: 'Complete Tasks', desc: 'Browse 161+ tasks and surveys. Answer questions one at a time. Each completed task adds real money to your balance.' },
              { num: 4, icon: Wallet, title: 'Withdraw Instantly', desc: 'Send your balance to M-Pesa via B2C payout. Money arrives in 1-2 minutes.' },
            ].map(step => (
              <div key={step.num} className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-amber-500/20 transition-all">
                <div className="absolute top-4 right-4 text-5xl font-black text-white/5 group-hover:text-amber-500/10 transition-colors">{step.num}</div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 flex items-center justify-center mb-3">
                  <step.icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tiers */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Earning Tiers</h2>
            <p className="text-muted-foreground">Pick the tier that fits your earning ambition.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((tier, i) => (
              <div
                key={tier.name}
                className={`glass ${tier.border} ${i === 1 ? 'glow' : ''} rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform`}
              >
                {/* Glow background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tier.glow} opacity-50 pointer-events-none`} />

                {i === 1 && (
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold rounded-bl-2xl z-10">
                    POPULAR
                  </div>
                )}

                <div className="relative p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.glow} flex items-center justify-center mb-4`}>
                    <tier.icon className={`w-7 h-7 ${tier.iconColor}`} />
                  </div>
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-2xl font-bold">{tier.name} Tier</h3>
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${tier.badgeClass} font-semibold`}>{tier.badge}</span>
                  </div>
                  <p className="text-3xl font-extrabold mb-1">
                    {tier.reward}<span className="text-sm font-normal text-muted-foreground">/task</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">Activation: <span className="font-semibold text-amber-400">KES {tier.fee}</span></p>
                  <ul className="space-y-2 mb-5">
                    {tier.perks.map(p => (
                      <li key={p} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`w-4 h-4 ${tier.iconColor} shrink-0`} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/auth/register?tier=${tier.name.toLowerCase()}`}
                    className={`flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-semibold transition-all ${
                      tier.name === 'Gold' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400'
                      : tier.name === 'VIP' ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400'
                      : 'glass border border-white/10 text-foreground hover:bg-white/10'
                    }`}
                  >
                    Choose {tier.name} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-20">
          {[
            { icon: Shield, title: 'Bank-Grade Security', desc: 'Firebase Authentication + Google SSO. Your data is encrypted and never shared.' },
            { icon: Zap, title: 'Instant M-Pesa', desc: 'STK push activation + B2C withdrawals. Money lands in your M-Pesa in 1-2 minutes.' },
            { icon: Users, title: 'Referral Rewards', desc: 'Earn KES 10 for every friend who activates. Build passive income.' },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-6 border border-white/5 group hover:border-amber-500/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 rounded-3xl blur-2xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to start earning?</h2>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
              Create your free account, pick your tier, complete your first task in under 5 minutes.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-slate-950 text-base font-bold hover:from-amber-400 hover:via-orange-400 hover:to-red-400 glow transition-all shadow-xl shadow-amber-500/30 mt-4"
            >
              Sign Up Free — Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/5 mt-auto relative z-10">
        <div className="container mx-auto max-w-6xl px-4 py-8 text-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950 text-sm">Q</div>
              <span className="font-medium">QuickCash</span>
              <span className="text-muted-foreground">· © 2026</span>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground text-xs">
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Help</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
