"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { apiJson } from "@/lib/api-fetch";
import {
  ArrowDownToLine, ArrowUpFromLine, Gift, Sparkles, Trophy,
  RefreshCw, Wallet, ListChecks, PlayCircle, TrendingUp,
} from "lucide-react";

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
  const router = useRouter();
  const { appUser, loading } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => { if (!loading && !appUser) router.push('/auth/login'); }, [loading, appUser, router]);

  const load = async () => {
    setTxLoading(true);
    try {
      const data = await apiJson<{ transactions: Tx[] }>(`/api/payments/transactions?limit=200`);
      setTxs(data.transactions || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setTxLoading(false);
    }
  };
  useEffect(() => { if (appUser) load(); }, [appUser]);

  if (loading || !appUser) return <DashboardShell><div className="text-muted-foreground">Loading...</div></DashboardShell>;

  return (
    <DashboardShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-1">Your full earnings + withdrawals history</p>
          </div>
          <button onClick={load} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <Card className="glass border-white/5 rounded-2xl">
          <CardContent className="p-0">
            {txLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
                <p className="text-sm mt-2">Loading...</p>
              </div>
            ) : txs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No transactions yet.</p>
                <p className="text-xs mt-1">Complete a task to start earning!</p>
                <Button asChild variant="outline" size="sm" className="mt-4 glass">
                  <a href="/dashboard">Browse tasks →</a>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {txs.map(tx => {
                  const isCredit = tx.direction === 'CREDIT';
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400'}`}>
                          {tx.type === 'TASK_REWARD' ? <ListChecks className="w-5 h-5" /> :
                           tx.type === 'AD_REWARD' ? <PlayCircle className="w-5 h-5" /> :
                           tx.type === 'REFERRAL_BONUS' ? <Gift className="w-5 h-5" /> :
                           tx.type === 'WITHDRAWAL' ? <ArrowUpFromLine className="w-5 h-5" /> :
                           tx.type === 'DEPOSIT' ? <ArrowDownToLine className="w-5 h-5" /> :
                           tx.type === 'ACTIVATION' ? <Trophy className="w-5 h-5" /> :
                           <TrendingUp className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{tx.description || tx.type.replace(/_/g, ' ').toLowerCase()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()} · {tx.reference}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className={`font-semibold ${isCredit ? 'text-emerald-400' : 'text-orange-400'}`}>
                          {isCredit ? '+' : '−'} KES {tx.amount.toLocaleString()}
                        </p>
                        <p className={`text-[10px] ${tx.status === 'COMPLETED' ? 'text-emerald-400' : tx.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'}`}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
