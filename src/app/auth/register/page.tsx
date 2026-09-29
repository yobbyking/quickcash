"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Eye, EyeOff, User, Mail, Phone, Lock, Gift, ArrowRight, CheckCircle2,
  Sparkles, Shield, ChevronRight,
} from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [refCode, setRefCode] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Real-time password strength meter
  const pwdStrength = (() => {
    const pwd = form.password;
    if (!pwd) return { score: 0, label: "", color: "bg-white/5", text: "text-muted-foreground" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score >= 4) return { score, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
    if (score >= 3) return { score, label: "Good", color: "bg-cyan-500", text: "text-cyan-400" };
    if (score >= 1) return { score, label: "Weak", color: "bg-amber-500", text: "text-amber-400" };
    return { score, label: "Too short", color: "bg-red-500", text: "text-red-400" };
  })();

  // Match indicator
  const pwdMatch = form.password && form.confirmPassword
    ? form.password === form.confirmPassword
      ? { ok: true, msg: "Passwords match" }
      : { ok: false, msg: "Passwords don't match" }
    : null;

  useEffect(() => {
    const ref = params.get("ref") || "";
    if (ref) setRefCode(ref.toUpperCase());
  }, [params]);

  const update = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, referralCode: refCode || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }
      toast.success("Account created! Activate with M-Pesa to start earning.");
      router.push("/auth/verify");
    } catch (err) {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join thousands earning KES daily on Kenya's premium wallet."
      footerHref="/auth/login"
      footerLink="Sign in instead"
      footerActionText="Already have an account?"
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Referral badge — premium gold */}
        {refCode && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-amber-400/10 border border-amber-500/30 text-amber-200">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Referred by <span className="font-mono font-bold">{refCode}</span></p>
              <p className="text-[11px] text-amber-300/80">You'll both earn 10 KES after activation</p>
            </div>
          </div>
        )}

        {/* Email */}
        <Field icon={Mail} label="Email address" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={e => update("email", e.target.value)}
            className="pl-11 bg-white/5 border-white/10 h-12 text-base focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
            placeholder="you@example.com"
          />
        </Field>

        {/* Username */}
        <Field icon={User} label="Username" htmlFor="username" hint="3–20 chars · letters, numbers, underscores">
          <Input
            id="username"
            type="text"
            required
            minLength={3}
            maxLength={20}
            pattern="^[a-zA-Z0-9_]+$"
            autoComplete="username"
            value={form.username}
            onChange={e => update("username", e.target.value)}
            className="pl-11 bg-white/5 border-white/10 h-12 text-base focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
            placeholder="yobby1"
          />
        </Field>

        {/* Phone */}
        <Field icon={Phone} label="M-Pesa Phone Number" htmlFor="phone" hint="Safaricom number registered with M-Pesa">
          <Input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            value={form.phone}
            onChange={e => update("phone", e.target.value)}
            className="pl-11 bg-white/5 border-white/10 h-12 text-base focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
            placeholder="0712345678"
          />
        </Field>

        {/* Password + Confirm — side by side on larger screens */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={e => update("password", e.target.value)}
                className="pl-11 pr-11 bg-white/5 border-white/10 h-12 text-base focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.password && (
              <div className="space-y-1 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= pwdStrength.score ? pwdStrength.color : "bg-white/5"}`}
                    />
                  ))}
                </div>
                <p className={`text-[10px] ${pwdStrength.text}`}>{pwdStrength.label}</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={e => update("confirmPassword", e.target.value)}
                className={`pl-11 pr-11 bg-white/5 border-white/10 h-12 text-base focus-visible:ring-emerald-500/20 ${
                  pwdMatch?.ok === false ? "border-red-500/50" : pwdMatch?.ok === true ? "border-emerald-500/50" : "border-white/10"
                }`}
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwdMatch && (
              <p className={`text-[10px] flex items-center gap-1 ${pwdMatch.ok ? "text-emerald-400" : "text-red-400"}`}>
                {pwdMatch.ok ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3">⚠</span>}
                {pwdMatch.msg}
              </p>
            )}
          </div>
        </div>

        {/* Referral code */}
        <Field icon={Gift} label="Referral code (optional)" htmlFor="refCode">
          <Input
            id="refCode"
            type="text"
            value={refCode}
            onChange={e => setRefCode(e.target.value.toUpperCase())}
            className="pl-11 bg-white/5 border-white/10 h-12 text-base font-mono uppercase focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
            placeholder="YOBBY1"
          />
        </Field>

        {/* CTA button */}
        <Button
          type="submit"
          disabled={loading || (pwdMatch?.ok === false)}
          size="lg"
          className="w-full h-12 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:via-emerald-300 hover:to-cyan-400 glow font-semibold text-base group"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            <>
              Create account & start earning
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        {/* Activation fee disclosure */}
        <div className="rounded-2xl p-3.5 bg-gradient-to-br from-amber-500/8 to-amber-400/5 border border-amber-500/20 text-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-200 mb-0.5">One-time activation</p>
              <p className="text-muted-foreground leading-relaxed">
                After signing up, you'll pay <span className="text-amber-200 font-semibold">150 KES</span> via M-Pesa STK push to unlock earning, withdrawals, and referral rewards.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-amber-500/10">
            <Shield className="w-3 h-3 text-emerald-400" />
            No subscription · No monthly fees · Cancel anytime
          </div>
        </div>

        {/* Terms */}
        <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
          By creating an account, you agree to our Terms of Service and Privacy Policy. BCLB No. {process.env.NEXT_PUBLIC_BCLB_NUMBER || "7YGEB3OD"}.
        </p>
      </form>
    </AuthShell>
  );
}

function Field({ icon: Icon, label, htmlFor, hint, children }: { icon: any; label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        {children}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthShell title="Create your account"><div className="text-center text-muted-foreground">Loading...</div></AuthShell>}>
      <RegisterContent />
    </Suspense>
  );
}
