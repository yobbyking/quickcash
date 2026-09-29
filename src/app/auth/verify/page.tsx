"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Smartphone, Loader2, CheckCircle2, XCircle, RefreshCw, Shield, Sparkles,
  Zap, ArrowRight, AlertCircle, Clock, Wifi,
} from "lucide-react";
import { subscribeToPayment } from "@/lib/payment-socket";
import { Logo } from "@/components/logo";

const ACTIVATION_FEE = process.env.NEXT_PUBLIC_ACTIVATION_FEE || "150";
const BCLB = process.env.NEXT_PUBLIC_BCLB_NUMBER || "7YGEB3OD";

type Status = "IDLE" | "INITIATING" | "AWAITING_PIN" | "CONFIRMING" | "SUCCESS" | "FAILED";

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("IDLE");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);

  async function refreshStatus() {
    if (!paymentId) return;
    try {
      const res = await fetch(`/api/payments/status?paymentId=${paymentId}`);
      const data = await res.json();
      if (data.status === "COMPLETED") {
        setStatus("SUCCESS");
        toast.success("Payment confirmed! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1800);
      } else if (data.status === "FAILED" || data.status === "CANCELLED") {
        setStatus("FAILED");
        setError(data.failureReason || "Payment was not completed");
        toast.error(data.failureReason || "Payment failed");
      }
    } catch {}
  }

  // Total elapsed timer (since "AWAITING_PIN" started) — for premium "x seconds" indicator
  useEffect(() => {
    if (status === "AWAITING_PIN") {
      const t = setInterval(() => setTotalElapsed(s => s + 1), 1000);
      elapsedRef.current = t;
      return () => clearInterval(t);
    }
    if (status !== "AWAITING_PIN" && elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, [status]);

  // Countdown timer
  useEffect(() => {
    if (status === "AWAITING_PIN" && secondsLeft > 0) {
      const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
      return () => clearTimeout(t);
    }
    if (secondsLeft === 0 && status === "AWAITING_PIN") {
      // Auto-fallback: poll one more time
      refreshStatus();
    }
  }, [secondsLeft, status]);

  // WebSocket subscription
  useEffect(() => {
    if (!paymentId) return;
    unsubRef.current = subscribeToPayment(paymentId, (update) => {
      if (update.status === "COMPLETED") {
        setStatus("SUCCESS");
        toast.success("Payment confirmed! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1800);
      } else if (update.status === "FAILED" || update.status === "CANCELLED") {
        setStatus("FAILED");
        setError(update.failureReason || "Payment was not completed");
        toast.error(update.failureReason || "Payment failed");
      }
    });
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [paymentId, router]);

  // Poll fallback every 4 seconds
  useEffect(() => {
    if (!paymentId || status !== "AWAITING_PIN") return;
    pollRef.current = setInterval(refreshStatus, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [paymentId, status]);

  async function initiatePayment() {
    setStatus("INITIATING");
    setError(null);
    setTotalElapsed(0);
    try {
      const res = await fetch("/api/auth/verify", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStatus("FAILED");
        setError(data.error || "Failed to initiate payment");
        toast.error(data.error || "Failed to initiate payment");
        return;
      }
      setPaymentId(data.paymentId);
      setStatus("AWAITING_PIN");
      setSecondsLeft(120);
      toast.success("M-Pesa prompt sent! Check your phone.");
    } catch (err) {
      setStatus("FAILED");
      setError("Network error — please check your connection");
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={36} withText />
        </Link>
        <Button asChild variant="ghost" size="sm" className="glass">
          <Link href="/auth/login">
            Sign in <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </header>

      <main className="flex-1 container mx-auto px-4 flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          {/* Hero status */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center mb-4">
              {/* Outer glow rings */}
              {status === "AWAITING_PIN" && (
                <>
                  <div className="absolute -inset-6 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" />
                  <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                </>
              )}
              {status === "SUCCESS" && (
                <div className="absolute -inset-6 rounded-full bg-emerald-500/40 blur-2xl animate-pulse" />
              )}
              {status === "FAILED" && (
                <div className="absolute -inset-6 rounded-full bg-red-500/20 blur-2xl" />
              )}

              {/* Main icon */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 flex items-center justify-center border-2 border-white/10">
                {status === "IDLE" && <Shield className="w-11 h-11 text-emerald-400" />}
                {status === "INITIATING" && <Loader2 className="w-11 h-11 text-emerald-400 animate-spin" />}
                {status === "AWAITING_PIN" && <Smartphone className="w-11 h-11 text-emerald-400 animate-pulse-glow" />}
                {status === "SUCCESS" && <CheckCircle2 className="w-11 h-11 text-emerald-400" />}
                {status === "FAILED" && <XCircle className="w-11 h-11 text-red-400" />}
                {status === "CONFIRMING" && <Loader2 className="w-11 h-11 text-cyan-400 animate-spin" />}
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {status === "IDLE" && "Activate your account"}
              {status === "INITIATING" && "Connecting to M-Pesa..."}
              {status === "AWAITING_PIN" && "Check your phone"}
              {status === "SUCCESS" && "Payment confirmed!"}
              {status === "FAILED" && "Payment failed"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {status === "IDLE" && (
                <>Pay a one-time <span className="text-amber-400 font-semibold">{ACTIVATION_FEE} KES</span> via M-Pesa STK push to unlock earning, withdrawals, and referral rewards.</>
              )}
              {status === "INITIATING" && "Securely connecting to Safaricom M-Pesa. This takes a few seconds."
              }
              {status === "AWAITING_PIN" && (
                <>An M-Pesa prompt has been sent to your registered phone. Enter your M-Pesa PIN to authorize the payment.</>
              )}
              {status === "SUCCESS" && "Your account is now active. Redirecting you to your dashboard..."
              }
              {status === "FAILED" && (error || "Payment could not be completed. Please try again.")
              }
            </p>
          </div>

          {/* Premium progress steps */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2 relative">
              {/* Progress line connecting steps */}
              <div className="absolute top-5 left-[16%] right-[16%] h-0.5 bg-white/5" />
              <div
                className="absolute top-5 left-[16%] h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700"
                style={{
                  width: status === "SUCCESS" ? "68%" : status === "AWAITING_PIN" ? "34%" : status === "INITIATING" ? "10%" : "0%",
                }}
              />
              {[
                { n: 1, label: "Send prompt", icon: Zap, active: ["INITIATING", "AWAITING_PIN", "SUCCESS"].includes(status), done: ["AWAITING_PIN", "SUCCESS"].includes(status) },
                { n: 2, label: "Enter PIN", icon: Smartphone, active: status === "AWAITING_PIN", done: status === "SUCCESS" },
                { n: 3, label: "Confirm", icon: CheckCircle2, active: status === "SUCCESS", done: status === "SUCCESS" },
              ].map(step => (
                <div key={step.n} className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.done
                        ? "bg-gradient-to-br from-emerald-500 to-cyan-500 text-slate-950"
                        : step.active
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse-glow"
                        : "bg-white/5 text-muted-foreground border border-white/10"
                    }`}
                  >
                    {step.done ? <step.icon className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider ${step.active || step.done ? "text-emerald-300 font-medium" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live indicators while AWAITING_PIN */}
          {status === "AWAITING_PIN" && (
            <div className="mb-5 space-y-3">
              {/* Live countdown ring */}
              <div className="glass-strong rounded-2xl p-4 flex items-center gap-4">
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.05)" strokeWidth="3" fill="none" />
                    <circle
                      cx="28" cy="28" r="24" stroke="url(#countGrad)" strokeWidth="3" fill="none" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - secondsLeft / 120)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                    <defs>
                      <linearGradient id="countGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-emerald-400 font-mono">
                    {secondsLeft}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-300 mb-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Listening for confirmation
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting M-Pesa callback · {totalElapsed}s elapsed
                  </p>
                </div>
              </div>

              {/* Quick tips */}
              <div className="grid grid-cols-3 gap-2">
                <div className="glass rounded-xl p-2.5 text-center">
                  <Smartphone className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Check phone</p>
                </div>
                <div className="glass rounded-xl p-2.5 text-center">
                  <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Enter M-Pesa PIN</p>
                </div>
                <div className="glass rounded-xl p-2.5 text-center">
                  <Wifi className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Auto-confirms</p>
                </div>
              </div>

              <Button onClick={refreshStatus} variant="ghost" size="sm" className="w-full glass">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh status
              </Button>
            </div>
          )}

          {/* INITIATING skeleton */}
          {status === "INITIATING" && (
            <div className="mb-5 space-y-2">
              <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-3 w-2/3 mx-auto rounded-full bg-white/5 animate-pulse" />
            </div>
          )}

          {/* SUCCESS state */}
          {status === "SUCCESS" && (
            <div className="mb-5">
              <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-emerald-300">Account fully activated</p>
                  <p className="text-xs text-muted-foreground mt-0.5">You can now earn, withdraw, and refer friends.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Redirecting to dashboard...
                </div>
              </div>
            </div>
          )}

          {/* FAILED state with error details */}
          {status === "FAILED" && (
            <div className="mb-5 space-y-3">
              {error && (
                <div className="rounded-2xl p-3.5 bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-300 font-medium mb-0.5">Payment failed</p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium mt-0.5">Network / API unreachable</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <p className="text-muted-foreground">Resolution</p>
                  <p className="font-medium mt-0.5 text-emerald-300">Retry — no charge until success</p>
                </div>
              </div>
            </div>
          )}

          {/* Action button — IDLE / FAILED */}
          {(status === "IDLE" || status === "FAILED") && (
            <Button
              onClick={initiatePayment}
              size="lg"
              className="w-full h-14 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:via-emerald-300 hover:to-cyan-400 glow font-semibold text-base group"
            >
              {status === "FAILED" ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again — pay {ACTIVATION_FEE} KES
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Pay {ACTIVATION_FEE} KES via M-Pesa
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          )}

          {/* Why 150 KES disclosure */}
          <div className="mt-6 rounded-2xl p-4 glass border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-sm font-semibold">Why {ACTIVATION_FEE} KES?</p>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>One-time only — no subscription, no monthly fees</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Unlocks withdrawals, deposits, and referral rewards</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Supports SwiftWallet v3 secure payment infrastructure</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-2 border-t border-white/5">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Average confirmation time: 5–10 seconds</span>
            </div>
          </div>

          {/* Already activated? */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Already activated?{" "}
            <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Secured by SwiftWallet v3 ·</span>
          <span>BCLB No. <span className="font-mono text-foreground/80">{BCLB}</span></span>
        </div>
      </footer>
    </div>
  );
}
