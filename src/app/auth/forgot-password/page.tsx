"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      // Always show success message (don't reveal whether email exists)
      setSent(true);
      toast.success('Reset code sent! Check your email.');
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
          <p className="text-sm text-muted-foreground">Reset your password</p>
        </div>

        <div className="glass-strong gradient-border rounded-3xl p-6 md:p-8">
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 mb-3">
                  <Mail className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Forgot password?</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we'll send you a 6-digit reset code.
                </p>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email address</Label>
                  <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="bg-white/5 border-white/10 h-12" placeholder="you@example.com" />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 glow font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span>
                  ) : (
                    <>Send reset code <ArrowRight className="ml-2 w-4 h-4" /></>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-sm text-muted-foreground mb-4">
                If <span className="text-amber-400">{email}</span> is registered, a reset code is on its way.
              </p>
              <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950">
                <Link href={`/auth/reset-password?email=${encodeURIComponent(email)}`}>Enter reset code <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
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
