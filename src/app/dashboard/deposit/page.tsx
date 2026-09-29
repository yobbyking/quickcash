"use client";

import { DashboardShell, useMe } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Smartphone, Loader2, CheckCircle2, XCircle, RefreshCw, Shield, ArrowDownToLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { subscribeToPayment } from "@/lib/payment-socket";
import { useRouter } from "next/navigation";

type Status = "IDLE" | "INITIATING" | "AWAITING_PIN" | "SUCCESS" | "FAILED";

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000, 5000];

export default function DepositPage() {
  const { me } = useMe();
  const router = useRouter();
  const [amount, setAmount] = useState<number>(100);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("IDLE");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  async function refreshStatus() {
    if (!paymentId) return;
    try {
      const res = await fetch(`/api/payments/status?paymentId=${paymentId}`);
      const data = await res.json();
      if (data.status === "COMPLETED") {
        setStatus("SUCCESS");
        toast.success("Deposit confirmed!");
        setTimeout(() => router.push("/dashboard"), 1500);
      } else if (data.status === "FAILED" || data.status === "CANCELLED") {
        setStatus("FAILED");
        setError(data.failureReason || "Payment failed");
      }
    } catch {}
  }

  useEffect(() => {
    if (me) setPhone(me.phone);
  }, [me]);

  // Countdown
  useEffect(() => {
    if (status === "AWAITING_PIN" && secondsLeft > 0) {
      const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
      return () => clearTimeout(t);
    }
    if (secondsLeft === 0 && status === "AWAITING_PIN") refreshStatus();
  }, [secondsLeft, status]);

  // WebSocket
  useEffect(() => {
    if (!paymentId) return;
    const unsub = subscribeToPayment(paymentId, (update) => {
      if (update.status === "COMPLETED") {
        setStatus("SUCCESS");
        toast.success("Deposit confirmed!");
        setTimeout(() => router.push("/dashboard"), 1500);
      } else if (update.status === "FAILED" || update.status === "CANCELLED") {
        setStatus("FAILED");
        setError(update.failureReason || "Payment failed");
      }
    });
    return unsub;
  }, [paymentId, router]);

  // Poll fallback
  useEffect(() => {
    if (!paymentId || status !== "AWAITING_PIN") return;
    pollRef.current = setInterval(refreshStatus, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [paymentId, status]);

  async function initiate() {
    if (!amount || amount < 1) { toast.error("Enter a valid amount"); return; }
    if (amount > 70000) { toast.error("Max single deposit is 70,000 KES"); return; }
    setStatus("INITIATING");
    setError(null);
    try {
      const res = await fetch("/api/payments/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount, phone: phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("FAILED");
        setError(data.error || "Failed to initiate");
        toast.error(data.error || "Failed to initiate");
        return;
      }
      setPaymentId(data.paymentId);
      setStatus("AWAITING_PIN");
      setSecondsLeft(120);
      toast.success("M-Pesa prompt sent to your phone");
    } catch (err) {
      setStatus("FAILED");
      setError("Network error");
    }
  }

  return (
    <DashboardShell>
      <div className="max-w-md mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deposit via M-Pesa</h1>
          <p className="text-sm text-muted-foreground mt-1">Top up your wallet instantly using STK push.</p>
        </div>

        <Card className="glass border-white/5 rounded-2xl">
          <CardContent className="p-6 space-y-5">
            {/* Status hero */}
            <div className="text-center space-y-2 py-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 mb-1">
                {status === "INITIATING" && <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />}
                {status === "AWAITING_PIN" && <Smartphone className="w-8 h-8 text-emerald-400 animate-pulse-glow" />}
                {status === "SUCCESS" && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                {status === "FAILED" && <XCircle className="w-8 h-8 text-red-400" />}
                {(status === "IDLE") && <ArrowDownToLine className="w-8 h-8 text-emerald-400" />}
              </div>
              {status === "AWAITING_PIN" && (
                <p className="text-xs text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block mr-1.5" />
                  Listening · {secondsLeft}s left
                </p>
              )}
            </div>

            {(status === "IDLE" || status === "FAILED") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={1}
                    max={70000}
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-lg font-semibold"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {QUICK_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${amount === amt ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"}`}
                      >
                        {amt} KES
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">M-Pesa Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="bg-white/5 border-white/10"
                    placeholder="0712345678"
                  />
                  <p className="text-[11px] text-muted-foreground">Leave empty to use your registered phone.</p>
                </div>

                <Button onClick={initiate} size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400 glow font-semibold">
                  Deposit {amount.toLocaleString()} KES via M-Pesa
                </Button>

                {status === "FAILED" && error && (
                  <div className="text-sm text-red-400 text-center">{error}</div>
                )}
              </>
            )}

            {status === "AWAITING_PIN" && (
              <div className="text-center space-y-2 py-4">
                <h3 className="text-lg font-bold">Check your phone</h3>
                <p className="text-sm text-muted-foreground">
                  An M-Pesa prompt has been sent. Enter your M-Pesa PIN to authorize the {amount.toLocaleString()} KES deposit.
                </p>
                <Button onClick={refreshStatus} variant="ghost" size="sm" className="mt-2">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh status
                </Button>
              </div>
            )}

            {status === "SUCCESS" && (
              <div className="text-center space-y-2 py-4">
                <h3 className="text-lg font-bold text-emerald-400">Deposit confirmed!</h3>
                <p className="text-sm text-muted-foreground">Your wallet has been credited. Redirecting...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-xs text-muted-foreground flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <p>SwiftWallet v3 STK push with live webhook confirmation. Your deposit is reflected the moment M-Pesa confirms — no manual entry, no waiting.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
