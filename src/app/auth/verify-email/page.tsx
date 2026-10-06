"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Shield, Loader2, CheckCircle2, XCircle, RefreshCw, ArrowRight, Mail,
} from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const e = params.get('email');
    if (e) setEmail(e);
  }, [params]);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code.match(/^\d{6}$/)) {
      toast.error('Enter your email + 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Verification failed');
        return;
      }
      setVerified(true);
      toast.success('Email verified! Redirecting to activation...');
      setTimeout(() => router.push('/auth/activate'), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to resend');
        return;
      }
      toast.success('New code sent! Check your email.');
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setResending(false);
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
          <p className="text-sm text-muted-foreground">Verify your email to continue</p>
        </div>

        <div className="glass-strong gradient-border rounded-3xl p-6 md:p-8">
          {!verified ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 mb-3">
                  <Mail className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="text-amber-400 font-medium">{email || 'your email'}</span>.
                  Enter it below to verify your account.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/5 border-white/10 h-12" placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs uppercase tracking-wider text-muted-foreground">6-digit code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="bg-white/5 border-white/10 h-14 text-center text-2xl font-mono tracking-[0.3em]"
                    placeholder="••••••"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 glow font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    <>Verify email <ArrowRight className="ml-2 w-4 h-4" /></>
                  )}
                </Button>
              </form>

              <div className="mt-5 pt-4 border-t border-white/5 text-center space-y-2">
                <p className="text-xs text-muted-foreground">Didn't receive the code?</p>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={cooldown > 0 || resending}
                  onClick={resend}
                  className="text-amber-400"
                >
                  {resending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sending...</>
                  ) : cooldown > 0 ? (
                    <>Resend in {cooldown}s</>
                  ) : (
                    <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Resend code</>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-emerald-400">Email verified! 🎉</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your email is now verified. Redirecting you to activate your account...
              </p>
              <Loader2 className="w-5 h-5 mx-auto animate-spin text-amber-400" />
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
