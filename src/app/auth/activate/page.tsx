"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { apiJson, apiFetch } from "@/lib/api-fetch";
import {
  Shield, Loader2, CheckCircle2, XCircle, RefreshCw, Sparkles,
  Zap, ArrowRight, AlertCircle, Clock, Trophy, Crown,
} from "lucide-react";

type Status = "IDLE" | "INITIATING" | "AWAITING_PIN" | "SUCCESS" | "FAILED";

const TIERS = {
  silver: { name: 'Silver', fee: 199, icon: Trophy, color: 'slate' },
  gold:   { name: 'Gold',   fee: 299, icon: Crown, color: 'amber' },
  vip:   { name: 'VIP',    fee: 399, icon: Sparkles, color: 'violet' },
} as const;

export default function ActivatePage() {
  const router = useRouter();
  const { appUser, loading, signOut, refreshUser } = useAuth();
  const [status, setStatus] = useState<Status>("IDLE");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !appUser) router.push('/auth/login');
    if (!loading && appUser && !appUser.isEmailVerified) {
      router.push(`/auth/verify-email?email=${encodeURIComponent(appUser.email)}`);
    }
  }, [loading, appUser, router]);

  useEffect(() => {
    if (status === "AWAITING_PIN" && secondsLeft > 0) {
      const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
      return () => clearTimeout(t);
    }
    if (secondsLeft === 0 && status === "AWAITING_PIN") refreshStatus();
  }, [secondsLeft, status]);

  useEffect(() => {
    if (!paymentId || status !== "AWAITING_PIN") return;
    const poll = setInterval(refreshStatus, 4000);
    return () => clearInterval(poll);
  }, [paymentId, status]);

  async function refreshStatus() {
    if (!paymentId) return;
    try {
      const res = await apiFetch(`/api/payments/status?paymentId=${paymentId}`);
      const data = await res.json();
      if (data.status === "COMPLETED") {
        setStatus("SUCCESS");
        toast.success("Activation complete!");
        await refreshUser();
        setTimeout(() => router.push('/dashboard'), 1800);
      } else if (data.status === "FAILED" || data.status === "CANCELLED") {
        setStatus("FAILED");
        setError(data.failureReason || "Payment failed");
      }
    } catch {}
  }

  async function initiate() {
    setStatus("INITIATING");
    setError(null);
    try {
      const res = await apiFetch('/api/auth/activate', {
        method: 'POST',
        body: JSON.stringify({ tier: appUser.tier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("FAILED");
        setError(data.error || "Failed to initiate");
        toast.error(data.error || "Failed");
        return;
      }
      setPaymentId(data.paymentId);
      setStatus("AWAITING_PIN");
      setSecondsLeft(120);
      toast.success("M-Pesa prompt sent!");
    } catch (err: any) {
      setStatus("FAILED");
      setError(err.message || "Network error");
    }
  }

  if (loading || !appUser) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (appUser.isActivated) {
    router.push('/dashboard');
    return null;
  }

  const tier = TIERS[appUser.tier as keyof typeof TIERS] || TIERS.silver;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950">Q</div>
          <span className="font-bold">QuickCash</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
      </header>

      <main className="flex-1 container mx-auto px-4 flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center mb-4">
              {status === "AWAITING_PIN" && (
                <>
                  <div className="absolute -inset-6 rounded-full bg-amber-500/20 blur-2xl animate-pulse" />
                  <div className="absolute -inset-3 rounded-full border-2 border-amber-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                </>
              )}
              {status === "SUCCESS" && <div className="absolute -inset-6 rounded-full bg-emerald-500/40 blur-2xl animate-pulse" />}
              {status === "FAILED" && <div className="absolute -inset-6 rounded-full bg-red-500/20 blur-2xl" />}

              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-white/10 flex items-center justify-center">
                {status === "IDLE" && <Shield className="w-11 h-11 text-amber-400" />}
                {status === "INITIATING" && <Loader2 className="w-11 h-11 text-amber-400 animate-spin" />}
                {status === "AWAITING_PIN" && <Zap className="w-11 h-11 text-amber-400 animate-pulse-glow" />}
                {status === "SUCCESS" && <CheckCircle2 className="w-11 h-11 text-emerald-400" />}
                {status === "FAILED" && <XCircle className="w-11 h-11 text-red-400" />}
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {status === "IDLE" && `Activate ${tier.name} Tier`}
              {status === "INITIATING" && "Connecting..."}
              {status === "AWAITING_PIN" && "Check your phone"}
              {status === "SUCCESS" && "Activated!"}
              {status === "FAILED" && "Activation failed"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {status === "IDLE" && (
                <>Pay one-time <span className="text-amber-400 font-semibold">KES {tier.fee}</span> activation fee via M-Pesa STK push. Unlocks all your tier's tasks + withdrawals.</>
              )}
              {status === "INITIATING" && "Securely connecting to Safaricom M-Pesa..."}
              {status === "AWAITING_PIN" && "An M-Pesa prompt has been sent to your phone. Enter your M-Pesa PIN to authorize the payment."}
              {status === "SUCCESS" && "Your account is now active. Redirecting to dashboard..."}
              {status === "FAILED" && (error || "Payment could not be completed. Try again.")}
            </p>
          </div>

          <Card className="glass border-amber-500/20 rounded-2xl mb-5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tier.color === 'amber' ? 'from-amber-500/30 to-amber-500/10' : tier.color === 'violet' ? 'from-violet-500/30 to-violet-500/10' : 'from-slate-500/30 to-slate-500/10'} flex items-center justify-center`}>
                <tier.icon className={`w-6 h-6 ${tier.color === 'amber' ? 'text-amber-400' : tier.color === 'violet' ? 'text-violet-400' : 'text-slate-300'}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Your tier</p>
                <p className="text-xl font-bold">{tier.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-400">KES {tier.fee}</p>
                <p className="text-xs text-muted-foreground">one-time</p>
              </div>
            </CardContent>
          </Card>

          {status === "AWAITING_PIN" && (
            <Card className="glass border-amber-500/20 rounded-2xl mb-5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.05)" strokeWidth="3" fill="none" />
                    <circle cx="28" cy="28" r="24" stroke="url(#ag)" strokeWidth="3" fill="none" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - secondsLeft / 120)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                    <defs>
                      <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-400 font-mono">{secondsLeft}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-amber-300 mb-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    Listening for confirmation
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting M-Pesa callback</p>
                </div>
              </CardContent>
            </Card>
          )}

          {(status === "IDLE" || status === "FAILED") && (
            <Button
              onClick={initiate}
              size="lg"
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 glow font-semibold text-base"
            >
              {status === "FAILED" ? (
                <><RefreshCw className="w-4 h-4 mr-2" /> Try again — Pay KES {tier.fee}</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Pay KES {tier.fee} via M-Pesa <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          )}

          <Card className="glass border-white/5 rounded-2xl mt-5">
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-300">Why {tier.fee} KES?</span>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc">
                <li>One-time only — no subscription, no monthly fees</li>
                <li>Unlocks all tasks/surveys + instant M-Pesa withdrawals</li>
                <li>Prevents spam/bot accounts — keeps payouts fair for real users</li>
              </ul>
              <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Average confirmation: 5–10 seconds</span>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Need a different tier? <Link href="/auth/register" className="text-amber-400">Re-register</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
