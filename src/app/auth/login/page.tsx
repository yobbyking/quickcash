"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  Eye, EyeOff, Lock, ArrowRight, Chrome, Shield, Mail, CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { appUser, loading, signInWithGoogle, signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && appUser) {
      if (!appUser.isEmailVerified) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(appUser.email)}`);
      } else if (!appUser.isActivated) {
        router.push('/auth/activate');
      } else {
        router.push('/dashboard');
      }
    }
  }, [appUser, loading, router]);

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
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
          <p className="text-sm text-muted-foreground">Welcome back! Sign in to keep earning.</p>
        </div>

        <div className="glass-strong gradient-border rounded-3xl p-6 md:p-8">
          <Button
            onClick={handleGoogle}
            disabled={submitting || loading}
            size="lg"
            variant="outline"
            className="w-full h-12 glass mb-4 text-base font-medium"
          >
            <Chrome className="w-5 h-5 mr-2 text-blue-400" />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or sign in with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="bg-white/5 border-white/10 h-12" placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPwd ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="pl-11 pr-11 bg-white/5 border-white/10 h-12" placeholder="••••••" />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={submitting || loading}
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 glow font-semibold"
            >
              {submitting || loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Don't have an account? <Link href="/auth/register" className="text-amber-400 hover:text-amber-300 font-medium">Sign up free</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Shield className="inline w-3 h-3 mr-1 text-emerald-400" />
          Protected by Firebase Authentication
        </p>
      </div>
    </div>
  );
}
