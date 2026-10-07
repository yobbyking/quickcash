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
  Shield, CheckCircle2, Crown, Trophy, Chrome,
} from "lucide-react";

const TIERS = [
  { key: 'silver', name: 'Silver', icon: Trophy, badge: 'Starter', reward: 'KES 30-80/task', fee: 199, tone: 'slate' },
  { key: 'gold', name: 'Gold', icon: Crown, badge: 'Popular', reward: 'KES 100-250/task', fee: 299, tone: 'amber' },
  { key: 'vip', name: 'VIP', icon: Sparkles, badge: 'Premium', reward: 'KES 300-800/task', fee: 399, tone: 'violet' },
];

function RegisterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { appUser, needsRegistration, completeRegistration, firebaseUser, loading, signUpWithEmail } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    phone: '',
    referralCode: '',
  });
  const [tier, setTier] = useState('gold');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ref = params.get('ref');
    if (ref) setForm(f => ({ ...f, referralCode: ref.toUpperCase() }));
    const t = params.get('tier');
    if (t && ['silver', 'gold', 'vip'].includes(t)) setTier(t);
  }, [params]);

  useEffect(() => {
    if (!loading && appUser) {
      if (!appUser.isEmailVerified) router.push(`/auth/verify-email?email=${encodeURIComponent(appUser.email)}`);
      else if (!appUser.isActivated) router.push('/auth/activate');
      else router.push('/dashboard');
    }
  }, [appUser, loading, router]);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Password strength
  const pwdStrength = (() => {
    const pwd = form.password;
    if (!pwd) return { score: 0, label: '', color: 'bg-white/5', text: 'text-muted-foreground' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score >= 4) return { score, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
    if (score >= 3) return { score, label: 'Good', color: 'bg-cyan-500', text: 'text-cyan-400' };
    if (score >= 1) return { score, label: 'Weak', color: 'bg-amber-500', text: 'text-amber-400' };
    return { score, label: 'Too short', color: 'bg-red-500', text: 'text-red-400' };
  })();

  const pwdMatch = form.password && form.confirmPassword
    ? form.password === form.confirmPassword
      ? { ok: true, msg: 'Passwords match' }
      : { ok: false, msg: "Passwords don't match" }
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // If not yet a Firebase user, create one first
      if (!firebaseUser) {
        if (!form.email || !form.password) {
          toast.error('Enter email and password');
          setSubmitting(false);
          return;
        }
        if (form.password !== form.confirmPassword) {
          toast.error("Passwords don't match");
          setSubmitting(false);
          return;
        }
        try {
          await signUpWithEmail(form.email, form.password);
          toast.success('Account created! Complete your details below.');
        } catch (err: any) {
          toast.error(err.message || 'Sign up failed');
          setSubmitting(false);
          return;
        }
        return; // Will re-render with needsRegistration=true
      }

      // Already have Firebase user → complete registration
      if (form.password && form.password !== form.confirmPassword) {
        toast.error("Passwords don't match");
        setSubmitting(false);
        return;
      }

      await completeRegistration({
        username: form.username,
        phone: form.phone,
        tier,
        displayName: form.fullName || undefined,
        referralCode: form.referralCode || undefined,
      });
      toast.success('Account created! Check your email for the verification code.');
      router.push(`/auth/verify-email?email=${encodeURIComponent(form.email || firebaseUser?.email || '')}`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const { signInWithGoogle } = useAuth();
      await signInWithGoogle();
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

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
          {/* Google sign in — only show if no Firebase user yet */}
          {!firebaseUser && (
            <>
              <button
                onClick={handleGoogle}
                disabled={submitting}
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
                <span className="text-xs text-muted-foreground uppercase tracking-wider">or sign up with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          {firebaseUser && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Signed in as <span className="font-medium">{firebaseUser.email}</span></span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email + Password — only if no Firebase user yet */}
            {!firebaseUser && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" required value={form.email} onChange={e => update('email', e.target.value)} className="pl-11 bg-white/5 border-white/10 h-12" placeholder="you@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} required minLength={6} value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} className={`pl-11 pr-11 bg-white/5 h-12 ${pwdMatch?.ok === false ? 'border-red-500/50' : pwdMatch?.ok === true ? 'border-emerald-500/50' : 'border-white/10'}`} placeholder="••••••" />
                      <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {form.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwdStrength.score ? pwdStrength.color : 'bg-white/5'}`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={pwdStrength.text}>{pwdStrength.label}</span>
                      {pwdMatch && <span className={pwdMatch.ok ? 'text-emerald-400' : 'text-red-400'}>{pwdMatch.msg}</span>}
                    </div>
                  </div>
                )}
              </>
            )}

            {showExtraFields && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="fullName" type="text" required value={form.fullName} onChange={e => update('fullName', e.target.value)} className="pl-11 bg-white/5 border-white/10 h-12" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="username" type="text" required minLength={3} maxLength={20} pattern="^[a-zA-Z0-9_]+$" value={form.username} onChange={e => update('username', e.target.value)} className="pl-11 bg-white/5 border-white/10 h-12" placeholder="johndoe" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground">M-Pesa Phone Number (for auto payments)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" type="tel" required value={form.phone} onChange={e => update('phone', e.target.value)} className="pl-11 bg-white/5 border-white/10 h-12" placeholder="0712345678" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Used for M-Pesa STK push activation + withdrawals</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Choose Your Tier</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIERS.map(t => (
                      <button key={t.key} type="button" onClick={() => setTier(t.key)} className={`p-3 rounded-2xl border text-left transition-all ${tier === t.key ? 'border-amber-500/60 bg-amber-500/10 glow' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
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
                  <Label htmlFor="refCode" className="text-xs uppercase tracking-wider text-muted-foreground">Referral Code (optional)</Label>
                  <Input id="refCode" type="text" value={form.referralCode} onChange={e => update('referralCode', e.target.value.toUpperCase())} className="bg-white/5 border-white/10 h-12 font-mono uppercase" placeholder="YOBBY1" />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting || loading || (form.password && form.password !== form.confirmPassword)}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-semibold text-base hover:from-amber-400 hover:to-orange-400 glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  {firebaseUser ? 'Complete Registration' : 'Create Account'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
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
