"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import {
  User as UserIcon, Mail, Phone, Trophy, Crown, Sparkles, Gift,
  Users, Copy, Check, Shield,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { appUser, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!loading && !appUser) router.push('/auth/login'); }, [loading, appUser, router]);

  if (loading || !appUser) return <DashboardShell><div className="text-muted-foreground">Loading...</div></DashboardShell>;

  const tierIcon = appUser.tier === 'vip' ? Sparkles : appUser.tier === 'gold' ? Crown : Trophy;
  const TierIcon = tierIcon;
  const tierColor = appUser.tier === 'vip' ? 'from-violet-500/20 to-violet-500/5 text-violet-400' : appUser.tier === 'gold' ? 'from-amber-500/20 to-amber-500/5 text-amber-400' : 'from-slate-500/20 to-slate-500/5 text-slate-300';

  const copyReferral = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${appUser.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account + referral link</p>
        </div>

        <Card className="glass border-white/5 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 text-2xl font-bold shrink-0">
                {(appUser.displayName || appUser.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{appUser.displayName || appUser.username}</h2>
                    <Badge className={`bg-gradient-to-br ${tierColor} border`}>
                      <TierIcon className="w-3 h-3 mr-1" /> {appUser.tier.toUpperCase()}
                    </Badge>
                    {appUser.isActivated && (
                      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">Activated</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{appUser.username} · since {new Date().getFullYear()}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <InfoRow icon={Mail} label="Email" value={appUser.email} />
                  <InfoRow icon={Phone} label="Phone" value={appUser.phone} />
                  <InfoRow icon={UserIcon} label="Username" value={appUser.username} mono />
                  <InfoRow icon={Gift} label="Referral code" value={appUser.referralCode} mono />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-amber-500/20 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              Referral Program
            </CardTitle>
            <CardDescription>Earn KES 10 for every friend who activates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Your referral link</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${appUser.referralCode}`}
                  className="bg-white/5 border-white/10 font-mono text-xs"
                />
                <Button onClick={copyReferral} className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400">
                  {copied ? <><Check className="w-4 h-4 mr-1" /> Copied</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <div className="text-sm">
              <span className="text-muted-foreground">Powered by</span>{" "}
              <span className="font-semibold">Firebase Auth + SwiftWallet v3</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
