"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-fetch";
import {
  ArrowUpFromLine, Loader2, CheckCircle2, XCircle, Shield,
} from "lucide-react";

type Status = "IDLE" | "INITIATING" | "SUCCESS" | "FAILED";

export default function WithdrawPage() {
  const router = useRouter();
  const { appUser, loading, refreshUser } = useAuth();
  const [amount, setAmount] = useState(100);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("IDLE");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !appUser) router.push('/auth/login'); }, [loading, appUser, router]);
  useEffect(() => { if (appUser) setPhone(appUser.phone); }, [appUser]);

  async function initiate() {
    if (amount < 50) { toast.error("Minimum withdrawal: 50 KES"); return; }
    if (appUser && amount > appUser.balance) { toast.error(`Insufficient balance: KES ${appUser.balance}`); return; }
    setStatus("INITIATING");
    setError(null);
    try {
      const res = await apiFetch('/api/payments/withdraw', { method: 'POST', body: JSON.stringify({ amount, phone: phone || undefined }) });
      const data = await res.json();
      if (!res.ok) {
        setStatus("FAILED");
        setError(data.error || "Failed");
        toast.error(data.error || "Failed");
        return;
      }
      setStatus("SUCCESS");
      toast.success("Withdrawal initiated! M-Pesa arrives in 1-2 min.");
      await refreshUser();
      setTimeout(() => router.push('/dashboard/transactions'), 2500);
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
          <h1 className="text-2xl font-bold">Withdraw to M-Pesa</h1>
          <p className="text-sm text-muted-foreground mt-1">Instant B2C payout via SwiftWallet.</p>
        </div>
        <Card className="glass border-amber-500/20 rounded-2xl">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-2 py-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/10 mb-1">
                {status === "INITIATING" && <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />}
                {status === "SUCCESS" && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                {status === "FAILED" && <XCircle className="w-8 h-8 text-red-400" />}
                {(status === "IDLE") && <ArrowUpFromLine className="w-8 h-8 text-orange-400" />}
              </div>
              {appUser && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Available</p>
                  <p className="text-2xl font-bold text-amber-400">KES {appUser.balance.toLocaleString()}</p>
                </div>
              )}
            </div>
            {(status === "IDLE" || status === "FAILED") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (KES) — minimum 50</Label>
                  <Input id="amount" type="number" min={50} max={70000} value={amount} onChange={e => setAmount(Number(e.target.value))} className="bg-white/5 border-white/10 text-lg font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Send to M-Pesa phone</Label>
                  <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="bg-white/5 border-white/10" placeholder="254712345678" />
                </div>
                <Button onClick={initiate} size="lg" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-slate-950 hover:from-orange-400 hover:to-red-400 glow font-semibold">
                  Withdraw {amount.toLocaleString()} KES
                </Button>
                {error && <div className="text-sm text-red-400 text-center">{error}</div>}
              </>
            )}
            {status === "INITIATING" && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Initiating B2C payout...</p>
              </div>
            )}
            {status === "SUCCESS" && (
              <div className="text-center space-y-2 py-4">
                <h3 className="text-lg font-bold text-emerald-400">Withdrawal initiated!</h3>
                <p className="text-sm text-muted-foreground">KES {amount} sent to {phone}. Arrives in 1-2 min.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-xs text-muted-foreground flex items-start gap-2">
          <Shield className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
          <p>Withdrawals via SwiftWallet v3 B2C. Balance held during payout and auto-refunded if failed.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
