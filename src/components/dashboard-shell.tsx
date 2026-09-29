"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  LayoutDashboard, User as UserIcon, Wallet, ArrowDownToLine, ArrowUpFromLine,
  ListChecks, LogOut, Menu, X, Copy, Check, Shield, Sparkles, PlayCircle,
} from "lucide-react";

interface MeData {
  id: string;
  email: string;
  username: string;
  phone: string;
  referralCode: string;
  isVerified: boolean;
  balance: number;
  totalEarned: number;
  tasksCompleted: number;
  adsWatchedToday: number;
  adsWatchedTotal: number;
  todayEarned: number;
  referralCount: number;
  verifiedReferrals: number;
  bclb: string;
  activationFee: number;
  referrer?: { username: string; referralCode: string } | null;
  createdAt: string;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const BCLB = process.env.NEXT_PUBLIC_BCLB_NUMBER || "7YGEB3OD";

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setMe(data);
      if (!data.isVerified && pathname.startsWith("/dashboard")) {
        router.push("/auth/verify");
        return;
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const logout = async () => {
    try {
      await fetch("/api/auth/me", { method: "DELETE" });
    } catch {}
    router.push("/auth/login");
  };

  const copyReferral = () => {
    if (!me) return;
    const url = `${window.location.origin}/auth/register?ref=${me.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/tasks", label: "Tasks & Surveys", icon: ListChecks },
    { href: "/dashboard/ads", label: "Watch Ads", icon: PlayCircle },
    { href: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
    { href: "/dashboard/withdrawal", label: "Withdraw", icon: ArrowUpFromLine },
    { href: "/dashboard/transactions", label: "Transactions", icon: Wallet },
    { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Logo size={48} />
        </div>
      </div>
    );
  }

  if (!me) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 glass">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-white/5"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/"><Logo size={32} withText /></Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Today</span>
              <span className="font-semibold text-amber-400">{(me.todayEarned || 0).toLocaleString()} KES</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="font-semibold text-emerald-400">{me.balance.toLocaleString()} KES</span>
            </div>
            <Button onClick={logout} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto max-w-7xl px-4 py-6 flex gap-6">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1.5 sticky top-24 self-start">
          <nav className="glass rounded-2xl p-2">
            {navItems.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    active ? "bg-emerald-500/15 text-emerald-300 font-semibold" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Referral card */}
          <div className="glass rounded-2xl p-3 mt-2 space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Your referral link</div>
            <div className="text-xs font-mono break-all bg-white/5 p-2 rounded-lg border border-white/10">
              /auth/register?ref={me.referralCode}
            </div>
            <Button onClick={copyReferral} size="sm" variant="outline" className="w-full glass">
              {copied ? <><Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy link</>}
            </Button>
            <div className="text-[10px] text-muted-foreground pt-1">
              <span className="text-emerald-400 font-semibold">{me.verifiedReferrals}</span> active referrals
            </div>
          </div>

          <div className="glass rounded-2xl p-3 mt-1 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-400" />
              BCLB No. <span className="font-mono text-foreground/80">{BCLB}</span>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-64 glass-strong p-4 space-y-2" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              {navItems.map(item => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${active ? "bg-emerald-500/15 text-emerald-300" : "text-muted-foreground"}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="rounded-xl p-3 glass text-xs">
                <div className="text-muted-foreground mb-1">Referral link</div>
                <div className="font-mono break-all">/auth/register?ref={me.referralCode}</div>
                <Button onClick={copyReferral} size="sm" variant="outline" className="w-full mt-2">
                  {copied ? "Copied!" : "Copy link"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="container mx-auto max-w-7xl px-4 py-6 text-center text-xs text-muted-foreground mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2">
          <span>BCLB No. <span className="font-mono text-foreground/80">{BCLB}</span></span>
          <span className="hidden md:inline">·</span>
          <span>SwiftPay © 2026 · Powered by SwiftWallet v3</span>
        </div>
      </footer>
    </div>
  );
}

export function StatCard({ label, value, sublabel, icon: Icon, tone = "emerald" }: { label: string; value: string; sublabel?: string; icon: any; tone?: "emerald" | "cyan" | "slate" }) {
  const toneClass = tone === "emerald" ? "from-emerald-500/20 to-emerald-500/5 text-emerald-400" : tone === "cyan" ? "from-cyan-500/20 to-cyan-500/5 text-cyan-400" : "from-slate-500/20 to-slate-500/5 text-slate-300";
  return (
    <Card className="glass border-white/5 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${toneClass} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function useMe() {
  const [me, setMe] = useState<MeData | null>(null);
  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) setMe(await res.json());
    } catch {}
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { me, reload };
}
