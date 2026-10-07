"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  Eye, EyeOff, Lock, ArrowRight, Shield, Mail, AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { appUser, loading, signInWithGoogle, signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      toast.success('Welcome back!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed');
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithEmail(email, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      // Show the error inline + as toast
      setErrorMsg(err.message || 'Login failed');
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/40">Q</div>
            <span className="text-2xl font-bold">QuickCash</span>
          </Link>
          <p className="text-sm text-muted-foreground">Welcome back! Sign in to keep earning.</p>
        </div>

        {/* Card */}
        <div className="glass-strong gradient-border rounded-3xl p-6 md:p-8">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={submitting || loading}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl glass border border-white/10 text-base font-medium hover:bg-white/10 transition-all mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or sign in with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 h-12 rounded-xl bg-white/5 border border-white/10 text-base outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 h-12 rounded-xl bg-white/5 border border-white/10 text-base outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="••••••"
                />
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
            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-semibold text-base hover:from-amber-400 hover:to-orange-400 glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting || loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
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
