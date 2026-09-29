"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ArrowRight, Mail, User, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      toast.success("Welcome back!");
      if (!data.isVerified) {
        router.push("/auth/verify");
      } else {
        router.push("/dashboard");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your SwiftPay account and keep earning."
      footerHref="/auth/register"
      footerLink="Create one now"
      footerActionText="Don't have an account?"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="text-xs uppercase tracking-wider text-muted-foreground">Email or Username</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="pl-11 bg-white/5 border-white/10 h-12 text-base focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
              placeholder="you@example.com or your_username"
              autoComplete="username"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pl-11 pr-11 bg-white/5 border-white/10 h-12 text-base focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
              placeholder="••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <input type="checkbox" className="rounded border-white/20 bg-white/5" />
            Remember me
          </label>
          <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full h-12 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:via-emerald-300 hover:to-cyan-400 glow font-semibold text-base group"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            <>
              Sign in
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        {/* Quick demo credentials hint */}
        <div className="rounded-2xl p-3 bg-gradient-to-br from-emerald-500/8 to-cyan-500/5 border border-emerald-500/20 text-xs space-y-1.5">
          <p className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <Sparkles className="w-3 h-3" /> Demo account
          </p>
          <p className="text-muted-foreground font-mono">
            <span className="text-foreground">user:</span> yobbyking2 <span className="text-muted-foreground/60">·</span> <span className="text-foreground">pass:</span> secret123
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
