"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Gift, Sparkles, RefreshCw, Wallet } from "lucide-react";

interface Tx {
  id: string;
  type: string;
  amount: number;
  direction: string;
  status: string;
  reference: string;
  description: string | null;
  createdAt: string;
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/transactions?limit=100");
      if (res.ok) {
        const data = await res.json();
        setTxs(data.transactions || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <DashboardShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-1">Complete history of your wallet movements.</p>
          </div>
          <button onClick={load} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <Card className="glass border-white/5 rounded-2xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
                <p className="text-sm mt-2">Loading...</p>
              </div>
            ) : txs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No transactions yet.</p>
                <p className="text-xs mt-1">Make your first deposit to get started!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {txs.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.direction === "CREDIT" ? "bg-emerald-500/15 text-emerald-400" : "bg-cyan-500/15 text-cyan-400"
                      }`}>
                        {tx.type === "DEPOSIT" ? <ArrowDownToLine className="w-5 h-5" /> : 
                         tx.type === "WITHDRAWAL" ? <ArrowUpFromLine className="w-5 h-5" /> : 
                         tx.type === "REFERRAL_BONUS" ? <Gift className="w-5 h-5" /> : 
                         <Sparkles className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description || tx.type.replace(/_/g, ' ').toLowerCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()} · {tx.reference}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`font-semibold ${tx.direction === "CREDIT" ? "text-emerald-400" : "text-cyan-400"}`}>
                        {tx.direction === "CREDIT" ? "+" : "−"} {tx.amount.toLocaleString()} KES
                      </p>
                      <p className={`text-[10px] ${tx.status === "COMPLETED" ? "text-emerald-400" : tx.status === "PENDING" ? "text-yellow-400" : "text-red-400"}`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
