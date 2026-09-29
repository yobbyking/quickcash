"use client";

import { Logo } from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Sparkles, Zap, Wallet, Users, ListChecks, PlayCircle, CheckCircle2 } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footerLink,
  footerHref,
  footerText,
  footerActionText,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerLink?: string;
  footerHref?: string;
  footerText?: string;
  footerActionText?: string;
}) {
  const BCLB = process.env.NEXT_PUBLIC_BCLB_NUMBER || "7YGEB3OD";
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left visual panel — hidden on small screens */}
      <aside className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Soft inner aurora */}
        <div
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 50% at 10% 10%, rgba(52, 211, 153, 0.18), transparent 60%), radial-gradient(40% 40% at 90% 90%, rgba(6, 182, 212, 0.18), transparent 60%), radial-gradient(30% 30% at 50% 100%, rgba(168, 85, 247, 0.10), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(52, 211, 153, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.6) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, #000 30%, transparent 100%)",
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <Logo size={42} />
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tight gradient-text">SwiftPay</span>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase">M-Pesa Wallet · Earn</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-8 max-w-md">
          <div>
            <Badge variant="outline" className="mb-4 border-amber-500/40 text-amber-300 bg-amber-500/10">
              <Sparkles className="w-3 h-3 mr-1.5" /> Earn Real KES Daily
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight leading-[1.1] mb-3">
              Get paid to <span className="gradient-text">answer, watch &amp; refer.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Complete surveys, watch sponsored ads, invite friends. Real KES, instantly withdrawable to your M-Pesa.
            </p>
          </div>

          {/* Three ways to earn — mini cards */}
          <div className="space-y-2.5">
            {[
              { icon: ListChecks, tone: "from-emerald-500/20 to-emerald-500/5 text-emerald-400", title: "Tasks & Surveys", payout: "8–35 KES each" },
              { icon: PlayCircle, tone: "from-cyan-500/20 to-cyan-500/5 text-cyan-400", title: "Watch Ads", payout: "2 KES · 15/day" },
              { icon: Users, tone: "from-amber-500/20 to-amber-500/5 text-amber-400", title: "Refer Friends", payout: "10 KES each" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-2xl glass border-white/5 transition-transform hover:translate-x-1"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.tone} flex items-center justify-center shrink-0`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.payout}</p>
                </div>
                <Zap className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bank-grade security</span>
          <span className="opacity-50">·</span>
          <span>BCLB No. <span className="font-mono text-foreground/80">{BCLB}</span></span>
        </div>
      </aside>

      {/* Right panel — form area */}
      <main className="flex flex-col min-h-screen">
        {/* Mobile header (only on small screens) */}
        <header className="lg:hidden container px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={36} withText />
          </Link>
          {footerHref && (
            <Button asChild variant="ghost" size="sm">
              <Link href={footerHref}>{footerLink}</Link>
            </Button>
          )}
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            {/* Top badge with logo on desktop */}
            <div className="hidden lg:flex items-center justify-between mb-2">
              {footerHref ? (
                <Button asChild variant="ghost" size="sm" className="glass">
                  <Link href={footerHref}>
                    {footerLink} <span className="text-muted-foreground ml-1.5">→</span>
                  </Link>
                </Button>
              ) : <div />}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Secure session
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>

            {/* Form card */}
            <div className="glass-strong gradient-border rounded-3xl p-6 md:p-8">
              {children}
            </div>

            {/* Footer link */}
            {footerHref && (
              <p className="text-center text-sm text-muted-foreground">
                {footerActionText || "Don't have an account?"}{" "}
                <Link href={footerHref} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  {footerLink}
                </Link>
              </p>
            )}

            <p className="text-center text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Bank-grade encryption · BCLB No. {BCLB} · Powered by SwiftWallet v3
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
