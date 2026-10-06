'use client';

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ListChecks, ArrowDownToLine, ArrowUpFromLine, Wallet, User as UserIcon,
  LogOut, Menu, X, Trophy, Crown, Sparkles, Shield,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { appUser, signOut, refreshUser } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!appUser) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  const tierIcon = appUser.tier === 'vip' ? Sparkles : appUser.tier === 'gold' ? Crown : Trophy;
  const TierIcon = tierIcon;

  const navItems = [
    { href: "/dashboard", label: "Tasks", icon: ListChecks, exact: true },
    { href: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
    { href: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { href: "/dashboard/transactions", label: "Transactions", icon: Wallet },
    { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 glass">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-white/5" onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950">Q</div>
              <span className="font-bold hidden sm:inline">QuickCash</span>
            </Link>
            {appUser.isActivated && (
              <Badge className="ml-2 bg-amber-500/15 text-amber-300 border-amber-500/30 hidden sm:inline-flex">
                <TierIcon className="w-3 h-3 mr-1" /> {appUser.tier.toUpperCase()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="font-semibold text-amber-400">{appUser.balance.toLocaleString()} KES</span>
            </div>
            <Button onClick={signOut} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto max-w-7xl px-4 py-6 flex gap-6">
        <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1.5 sticky top-24 self-start">
          <nav className="glass rounded-2xl p-2">
            {navItems.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-amber-500/15 text-amber-300 font-semibold" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {!appUser.isActivated && (
            <div className="glass rounded-2xl p-3 mt-2 space-y-2 border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-300 text-sm">
                <Shield className="w-4 h-4" /> Activation required
              </div>
              <p className="text-xs text-muted-foreground">Activate to unlock tasks + withdrawals</p>
              <Button asChild size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950">
                <Link href="/auth/activate">Activate now</Link>
              </Button>
            </div>
          )}
        </aside>

        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-64 glass-strong p-4 space-y-2" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${(item.exact ? pathname === item.href : pathname.startsWith(item.href)) ? "bg-amber-500/15 text-amber-300" : "text-muted-foreground"}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <footer className="container mx-auto max-w-7xl px-4 py-6 text-center text-xs text-muted-foreground mt-auto">
        QuickCash · © 2026 · Powered by SwiftWallet v3
      </footer>
    </div>
  );
}
