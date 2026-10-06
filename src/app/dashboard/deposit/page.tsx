"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, apiJson } from "@/lib/api-fetch";
import {
  ArrowDownToLine, Loader2, CheckCircle2, XCircle, Shield, Smartphone,
} from "lucide-react";

type Status = "IDLE" | "INITIATING" | "AWAITING_PIN" | "SUCCESS" | "FAILED";
const QUICK = [50, 100, 250, 500, 1000, 5000];

export default function DepositPage() {
  const router = useRouter();
  const { appUser, loading, refreshUser } = useAuth();
  const [amount, setAmount] = useState(100);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("IDLE");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !appUser) router.push('/auth/login'); }, [loading, appUser, router]);
  useEffect(() => { if (appUser) setPhone(appUser.phone); }, [appUser]);
  useEffect(() => {
    if (status === "AWAITING_PIN" && secondsLeft > 0) {
      const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
      return () => clearTimeout(t);
    }
    if (secondsLeft === 0 && status === "AWAITING_PIN") refresh();
  }, [secondsLeft, status]);
  useEffect(() => {
    if (!paymentId || status !== "AWAITING_PIN") return;
    const p = setInterval(refresh, 4000);
    return () => clearInterval(p);
  }, [paymentId, status]);

  async function refresh() {
    if (!paymentId) return;
    try {
      const data = await apiJson<any>(`/api/payments/status?paymentId=${paymentId}`);
      if (data.status === "COMPLETED") {
        setStatus("SUCCESS");
        toast.success("Deposit confirmed!");
        await refreshUser();
        setTimeout(() => router.push('/dashboard'), 1800);
      } else if (data.status === "FAILED" || data.status === "CANCELLED") {
        setStatus("FAILED");
        setError(data.failureReason || "Failed");
      }
    } catch {}
  }

  async function initiate() {
    if (amount < 1 || amount > 70000) { toast.error("Amount must be 1-70000 KES"); return; }
    setStatus("INITIATING");
    setError(null);
    try {
      const res = await apiFetch('/api/payments/deposit', { method: 'POST', body: JSON.stringify({ amount, phone: phone || undefined }) });
      const data = await res.json();
      if (!res.ok) {
        setStatus("FAILED");
        setError(data.error || "Failed");
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

  if (loading || !appUser) return <DashboardShell><div className="text-muted-foreground">Loading...</div></DashboardShell>;
  if (!appUser.isActivated) { router.push('/auth/activate'); return null; }

  return (
    <DashboardShell>
      <div className="max-w-md mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Deposit via M-Pesa</h1>
          <p className="text-sm text-muted-foreground mt-1">Top up your balance instantly.</p>
        </div>
        <Card className="glass border-amber-500/20 rounded-2xl">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-2 py-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 mb-1">
                {status === "INITIATING" && <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />}
                {status === "AWAITING_PIN" && <Smartphone className="w-8 h-8 text-amber-400 animate-pulse-glow" />}
                {status === "SUCCESS" && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                {status === "FAILED" && <XCircle className="w-8 h-8 text-red-400" />}
                {status === "IDLE" && <ArrowDownToLine className="w-8 h-8 text-amber-400" />}
              </div>
              {status === "AWAITING_PIN" && (
                <p className="text-xs text-amber-400 font-mono">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block mr-1.5" />
                  Listening · {secondsLeft}s
                </p>
              )}
            </div>
            {(status === "IDLE" || status === "FAILED") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (KES)</Label>
                  <Input id="amount" type="number" min={1} max={70000} value={amount} onChange={e => setAmount(Number(e.target.value))} className="bg-white/5 border-white/10 text-lg font-semibold" />
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {QUICK.map(a => (
                      <button key={a} type="button" onClick={() => setAmount(a)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${amount === a ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/5 border border-white/10 text-muted-foreground'}`}>
                        {a} KES
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">M-Pesa Phone (optional)</Label>
                  <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="bg-white/5 border-white/10" placeholder="254712345678" />
                </div>
                <Button onClick={initiate} size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 glow font-semibold">
                  Deposit {amount.toLocaleString()} KES
                </Button>
                {error && <div className="text-sm text-red-400 text-center">{error}</div>}
              </>
            )}
            {status === "AWAITING_PIN" && (
              <div className="text-center space-y-2 py-4">
                <h3 className="text-lg font-bold">Check your phone</h3>
                <p className="text-sm text-muted-foreground">M-Pesa prompt sent. Enter your PIN.</p>
                <Button onClick={refresh} variant="ghost" size="sm" className="mt-2">Refresh status</Button>
              </div>
            )}
            {status === "SUCCESS" && (
              <div className="text-center space-y-2 py-4">
                <h3 className="text-lg font-bold text-emerald-400">Deposit confirmed!</h3>
                <p className="text-sm text-muted-foreground">Redirecting...</p>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-xs text-muted-foreground flex items-start gap-2">
          <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p>SwiftWallet v3 STK push with live webhook. Money reflected instantly on M-Pesa confirmation.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
