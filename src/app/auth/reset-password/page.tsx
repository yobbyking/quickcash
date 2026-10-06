"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Eye, EyeOff, Lock, Loader2, CheckCircle2, ArrowRight, KeyRound,
} from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const e = params.get('email');
    if (e) setEmail(e);
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Email required'); return; }
    if (!code.match(/^\d{6}$/)) { toast.error('Enter the 6-digit code'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 chars'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Reset failed');
        return;
      }
      setDone(true);
      toast.success('Password updated! You can now log in.');
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/40">Q</div>
            <span className="text-2xl font-bold">QuickCash</span>
          </Link>
          <p className="text-sm text-muted-foreground">Set a new password</p>
        </div>

        <div className="glass-strong gradient-border rounded-3xl p-6 md:p-8">
          {!done ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 mb-3">
                  <KeyRound className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Reset password</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code we sent to your email + your new password.
                </p>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="bg-white/5 border-white/10 h-12" placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs uppercase tracking-wider text-muted-foreground">6-digit code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    className="bg-white/5 border-white/10 h-14 text-center text-2xl font-mono tracking-[0.3em]"
                    placeholder="••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pwd" className="text-xs uppercase tracking-wider text-muted-foreground">New password (min 6 chars)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="pwd"
                      type={showPwd ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="pl-11 pr-11 bg-white/5 border-white/10 h-12"
                      placeholder="••••••"
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 glow font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Updating...</span>
                  ) : (
                    <>Update password <ArrowRight className="ml-2 w-4 h-4" /></>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-emerald-400">Password updated!</h2>
              <p className="text-sm text-muted-foreground">Redirecting to login...</p>
              <Loader2 className="w-5 h-5 mx-auto mt-4 animate-spin text-amber-400" />
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/auth/login" className="text-amber-400 hover:text-amber-300">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
