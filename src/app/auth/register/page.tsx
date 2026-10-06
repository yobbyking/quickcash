"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  Eye, EyeOff, User, Mail, Phone, Lock, ArrowRight, Sparkles,
  Shield, CheckCircle2, Crown, Trophy, Star, Chrome,
} from "lucide-react";
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { auth } from "@/lib/firebase";

const TIERS = [
  { key: 'silver', name: 'Silver', icon: Trophy, badge: 'Starter', reward: 'KES 30-80/task', fee: 199, tone: 'slate' },
  { key: 'gold', name: 'Gold', icon: Crown, badge: 'Popular', reward: 'KES 100-250/task', fee: 299, tone: 'amber' },
  { key: 'vip', name: 'VIP', icon: Sparkles, badge: 'Premium', reward: 'KES 300-800/task', fee: 399, tone: 'violet' },
];

function RegisterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { appUser, needsRegistration, completeRegistration, signInWithGoogle, firebaseUser, loading, error } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    phone: '',
    referralCode: '',
  });
  const [tier, setTier] = useState('gold');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ref = params.get('ref');
    if (ref) setForm(f => ({ ...f, referralCode: ref.toUpperCase() }));
    const t = params.get('tier');
    if (t && ['silver', 'gold', 'vip'].includes(t)) setTier(t);
  }, [params]);

  // If user is already logged in and activated, redirect
  useEffect(() => {
    if (!loading && appUser) {
      router.push(appUser.isActivated ? '/dashboard' : '/auth/activate');
    }
  }, [appUser, loading, router]);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

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
      if (!firebaseUser) {
        // Need to sign up with Firebase first
        if (!form.email || !form.password) {
          toast.error('Enter email and password');
          return;
        }
        // Use the auth-context's signUpWithEmail
        const { signUpWithEmail } = useAuth();
        await signUpWithEmail(form.email, form.password);
        toast.success('Account created! Complete your details below.');
        return;
      }
      // Already have a Firebase user → complete registration
      await completeRegistration({
        username: form.username,
        phone: form.phone,
        tier,
        referralCode: form.referralCode || undefined,
      });
      toast.success('Registration complete! Activate your account to start earning.');
      router.push('/auth/activate');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Show form: Firebase user needs to complete registration, OR no Firebase user yet
  const showExtraFields = needsRegistration || !!firebaseUser;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/40">Q</div>
            <span className="text-2xl font-bold">QuickCash</span>
          </Link>
          <p className="text-sm text-muted-foreground">Create your free account in 30 seconds</p>
        </div>

        {/* Card */}
        <div className="glass-strong gradient-border rounded-3xl p-6 md:p-8">
          {/* Google sign in */}
          {!firebaseUser && (
            <>
              <Button
                onClick={handleGoogle}
                disabled={submitting}
                size="lg"
                variant="outline"
                className="w-full h-12 glass mb-4 text-base font-medium"
              >
                <Chrome className="w-5 h-5 mr-2 text-blue-400" />
                Continue with Google
              </Button>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">or sign up with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          {firebaseUser && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Signed in as <span className="font-medium">{firebaseUser.email}</span> — complete your details</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email + password — only show if no Firebase user yet */}
            {!firebaseUser && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" required value={form.email} onChange={e => update('email', e.target.value)} className="pl-11 bg-white/5 border-white/10 h-12" placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type={showPwd ? 'text' : 'password'} required minLength={6} value={form.password} onChange={e => update('password', e.target.value)} className="pl-11 pr-11 bg-white/5 border-white/10 h-12" placeholder="Min 6 chars" />
                    <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showExtraFields && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="username" type="text" required minLength={3} maxLength={20} pattern="^[a-zA-Z0-9_]+$" value={form.username} onChange={e => update('username', e.target.value)} className="pl-11 bg-white/5 border-white/10 h-12" placeholder="yobby1" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground">M-Pesa Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="phone" type="tel" required value={form.phone} onChange={e => update('phone', e.target.value)} className="pl-11 bg-white/5 border-white/10 h-12" placeholder="254712345678" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Choose your tier</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIERS.map(t => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTier(t.key)}
                        className={`p-3 rounded-2xl border text-left transition-all ${tier === t.key ? `border-amber-500/60 bg-amber-500/10 glow` : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <t.icon className={`w-3.5 h-3.5 ${tier === t.key ? 'text-amber-400' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-semibold ${tier === t.key ? 'text-amber-300' : ''}`}>{t.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{t.reward}</p>
                        <p className="text-[10px] mt-0.5">KES {t.fee} activation</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="refCode" className="text-xs uppercase tracking-wider text-muted-foreground">Referral code (optional)</Label>
                  <Input id="refCode" type="text" value={form.referralCode} onChange={e => update('referralCode', e.target.value.toUpperCase())} className="bg-white/5 border-white/10 h-12 font-mono uppercase" placeholder="YOBBY1" />
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={submitting || loading}
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 glow font-semibold"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>
                  {firebaseUser ? 'Complete registration' : 'Create account'} <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Already have an account? <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Shield className="inline w-3 h-3 mr-1 text-emerald-400" />
          Protected by Firebase Authentication · Bank-grade encryption
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
