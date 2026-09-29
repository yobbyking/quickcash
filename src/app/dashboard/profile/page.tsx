"use client";

import { DashboardShell, useMe } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Check, Shield, User, Mail, Phone, Gift, Calendar, CheckCircle2, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { me } = useMe();
  const [copied, setCopied] = useState(false);

  if (!me) return <DashboardShell><div className="text-muted-foreground">Loading...</div></DashboardShell>;

  const copyReferral = () => {
    const url = `${window.location.origin}/auth/register?ref=${me.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account details and referral link.</p>
        </div>

        {/* Profile card */}
        <Card className="glass border-white/5 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 text-2xl font-bold shrink-0">
                {me.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{me.username}</h2>
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Member since {new Date(me.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <InfoRow icon={Mail} label="Email" value={me.email} />
                  <InfoRow icon={Phone} label="Phone" value={me.phone} />
                  <InfoRow icon={User} label="Username" value={me.username} />
                  <InfoRow icon={Gift} label="Referral code" value={me.referralCode} mono />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral section */}
        <Card className="glass border-white/5 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Referral Program
            </CardTitle>
            <CardDescription>Earn 10 KES for every friend who activates their account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{me.referralCount}</div>
                <div className="text-xs text-muted-foreground">Total referrals</div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400">{me.verifiedReferrals}</div>
                <div className="text-xs text-muted-foreground">Active referrals</div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{me.verifiedReferrals * 10}</div>
                <div className="text-xs text-muted-foreground">Bonus earned (KES)</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Your referral link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${me.referralCode}`}
                  className="bg-white/5 border-white/10 font-mono text-xs"
                />
                <Button onClick={copyReferral} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400">
                  {copied ? <><Check className="w-4 h-4 mr-1" /> Copied</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                </Button>
              </div>
            </div>

            {me.referrer && (
              <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-xs text-muted-foreground flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                You were referred by <span className="font-mono text-foreground font-medium">{me.referrer.referralCode}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card className="glass border-white/5 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div className="text-sm">
              <span className="text-muted-foreground">BCLB No.</span>{" "}
              <span className="font-mono font-semibold">{me.bclb}</span>
              <span className="text-muted-foreground ml-2">· Regulated by Betting Control & Licensing Board</span>
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
      <div className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-xs uppercase tracking-wider text-muted-foreground ${className}`}>{children}</label>;
}
