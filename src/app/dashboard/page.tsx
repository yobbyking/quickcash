'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiJson, apiFetch } from "@/lib/api-fetch";
import {
  ListChecks, Trophy, Crown, Sparkles, Loader2, CheckCircle2,
  ArrowDownToLine, ArrowUpFromLine, Gift, PlayCircle, Clock,
  TrendingUp, Target, Star, ChevronRight, X, AlertCircle,
} from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: string;
  tier: string;
  category: string;
  reward: number;
  estimatedMinutes: number;
}

interface Question {
  id: string;
  questionOrder: number;
  text: string;
  answerType: string;  // DROPDOWN | MULTIPLE_CHOICE | RATING | YES_NO | TEXT
  options: string[];
  required: boolean;
}

const TIER_ICON = { silver: Trophy, gold: Crown, vip: Sparkles } as const;
const TIER_COLOR: Record<string, string> = {
  silver: 'from-slate-500/15 to-slate-500/5 text-slate-300 border-slate-500/30',
  gold:   'from-amber-500/15 to-amber-500/5 text-amber-300 border-amber-500/30',
  vip:   'from-violet-500/15 to-violet-500/5 text-violet-300 border-violet-500/30',
};

export default function DashboardPage() {
  const { appUser, loading, refreshUser } = useAuth();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [tierBreakdown, setTierBreakdown] = useState<any>({});
  const [oppLoading, setOppLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oppLoadingDetail, setOppLoadingDetail] = useState(false);

  useEffect(() => {
    if (!loading && !appUser) window.location.href = '/auth/login';
  }, [loading, appUser]);

  useEffect(() => {
    if (appUser) loadOpportunities();
  }, [appUser, tierFilter]);

  async function loadOpportunities() {
    setOppLoading(true);
    try {
      const params = new URLSearchParams();
      if (tierFilter) params.set('tier', tierFilter);
      const data = await apiJson<{ opportunities: Opportunity[]; tierBreakdown: any }>(`/api/opportunities/list?${params}`);
      setOpps(data.opportunities || []);
      setTierBreakdown(data.tierBreakdown || {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setOppLoading(false);
    }
  }

  async function openOpportunity(opp: Opportunity) {
    if (!appUser?.isActivated) {
      toast.error('Activate your account first');
      window.location.href = '/auth/activate';
      return;
    }
    setSelectedOpp(opp);
    setOppLoadingDetail(true);
    setAnswers({});
    setCurrentQ(0);
    try {
      const data = await apiJson<{ completion: { id: string }; opportunity: { questions: Question[] } }>(`/api/opportunities/start`, {
        method: 'POST',
        body: JSON.stringify({ opportunityId: opp.id }),
      });
      setCompletionId(data.completion.id);
      setQuestions(data.opportunity.questions);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start');
      setSelectedOpp(null);
    } finally {
      setOppLoadingDetail(false);
    }
  }

  function setAnswer(qId: string, value: string) {
    setAnswers(a => ({ ...a, [qId]: value }));
  }

  function nextQuestion() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    }
  }
  function prevQuestion() {
    if (currentQ > 0) setCurrentQ(q => q - 11);
  }

  async function submitOpportunity() {
    if (!completionId || !selectedOpp) return;
    // Validate required questions
    const unanswered = questions.filter(q => q.required && !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Answer required: ${unanswered[0].text}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/opportunities/submit', {
        method: 'POST',
        body: JSON.stringify({
          completionId,
          answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Submit failed');
        return;
      }
      toast.success(`+KES ${data.reward} credited! 🎉`);
      setSelectedOpp(null);
      setQuestions([]);
      setAnswers({});
      setCompletionId(null);
      await refreshUser();
      await loadOpportunities();
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !appUser) return <DashboardShell><div className="text-muted-foreground">Loading...</div></DashboardShell>;

  const userTierIdx = ['silver', 'gold', 'vip'].indexOf(appUser.tier);
  const allowedTiers = ['silver', 'gold', 'vip'].slice(0, userTierIdx + 1);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{appUser.username}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            You've earned <span className="text-amber-400 font-semibold">KES {appUser.totalEarned.toLocaleString()}</span> total · {appUser.tasksCompleted} tasks completed
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Available Balance" value={`KES ${appUser.balance.toLocaleString()}`} icon={TrendingUp} tone="amber" />
          <StatCard label="Tasks Completed" value={String(appUser.tasksCompleted)} icon={ListChecks} tone="emerald" />
          <StatCard label="Today's Earnings" value={`KES ${(appUser as any).todayEarned?.toLocaleString?.() || 0}`} icon={Target} tone="cyan" />
          <StatCard label="Total Earned" value={`KES ${appUser.totalEarned.toLocaleString()}`} icon={Trophy} tone="slate" />
        </div>

        {/* Tier filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTierFilter(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tierFilter === null ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40' : 'glass text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          {allowedTiers.map(t => {
            const Icon = TIER_ICON[t as keyof typeof TIER_ICON];
            const counts = tierBreakdown[t] || { tasks: 0, surveys: 0 };
            const total = counts.tasks + counts.surveys;
            return (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${tierFilter === t ? `bg-gradient-to-br ${TIER_COLOR[t]} border` : 'glass text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-4 h-4" />
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="text-xs opacity-70">({total})</span>
              </button>
            );
          })}
        </div>

        {/* Opportunity grid */}
        {oppLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-400" />
            <p className="text-sm text-muted-foreground mt-2">Loading opportunities...</p>
          </div>
        ) : opps.length === 0 ? (
          <Card className="glass border-white/5 rounded-2xl">
            <CardContent className="p-12 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-lg font-semibold">No opportunities available</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later for new earning opportunities</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {opps.map(opp => {
              const Icon = TIER_ICON[opp.tier as keyof typeof TIER_ICON];
              return (
                <Card
                  key={opp.id}
                  onClick={() => openOpportunity(opp)}
                  className="glass border-white/5 rounded-2xl hover:border-amber-500/30 transition-all cursor-pointer group"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge className={`bg-gradient-to-br ${TIER_COLOR[opp.tier]} border`}>
                        <Icon className="w-3 h-3 mr-1" /> {opp.tier.toUpperCase()}
                      </Badge>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-400">+{opp.reward}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">KES</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight">{opp.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{opp.description}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {opp.estimatedMinutes} min</span>
                      <span className="flex items-center gap-1"><ListChecks className="w-3 h-3" /> {opp.category}</span>
                    </div>
                    <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 group-hover:glow">
                      Start {opp.type === 'SURVEY' ? 'survey' : 'task'} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Task modal quiz */}
      <Dialog open={!!selectedOpp} onOpenChange={(open) => !open && !submitting && !oppLoadingDetail && setSelectedOpp(null)}>
        <DialogContent className="glass-strong max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge className={`bg-gradient-to-br ${selectedOpp ? TIER_COLOR[selectedOpp.tier] : ''} border`}>
                {selectedOpp?.tier.toUpperCase()}
              </Badge>
              <div className="text-right">
                <span className="text-xl font-bold text-amber-400">+{selectedOpp?.reward}</span>
                <span className="text-xs text-muted-foreground ml-1">KES</span>
              </div>
            </div>
            <DialogTitle className="text-xl mt-2">{selectedOpp?.title}</DialogTitle>
            <DialogDescription>{selectedOpp?.description}</DialogDescription>
          </DialogHeader>

          {/* Progress bar */}
          {questions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Question {currentQ + 1} of {questions.length}</span>
                <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
              </div>
              <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
            </div>
          )}

          {oppLoadingDetail ? (
            <div className="py-8 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-400" /></div>
          ) : questions.length > 0 ? (
            <div className="space-y-5 py-2">
              <QuestionRenderer
                question={questions[currentQ]}
                value={answers[questions[currentQ].id] || ''}
                onChange={(v) => setAnswer(questions[currentQ].id, v)}
              />

              <div className="flex gap-2 pt-3 border-t border-white/5">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={currentQ === 0 || submitting}
                  className="glass"
                >
                  ← Back
                </Button>
                {currentQ < questions.length - 1 ? (
                  <Button
                    onClick={nextQuestion}
                    disabled={!answers[questions[currentQ].id] && questions[currentQ].required}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950"
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    onClick={submitOpportunity}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit & earn KES {selectedOpp?.reward}</>}
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: "emerald" | "cyan" | "amber" | "slate" }) {
  const toneClass = tone === "amber" ? "from-amber-500/20 to-amber-500/5 text-amber-400"
    : tone === "cyan" ? "from-cyan-500/20 to-cyan-500/5 text-cyan-400"
    : tone === "emerald" ? "from-emerald-500/20 to-emerald-500/5 text-emerald-400"
    : "from-slate-500/20 to-slate-500/5 text-slate-300";
  return (
    <Card className="glass border-white/5 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${toneClass} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionRenderer({ question, value, onChange }: { question: Question; value: string; onChange: (v: string) => void }) {
  if (question.answerType === 'TEXT') {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {question.questionOrder}
          </span>
          <span>{question.text} {question.required && <span className="text-red-400">*</span>}</span>
        </Label>
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type your answer..." className="bg-white/5 border-white/10" rows={4} />
      </div>
    );
  }

  if (question.answerType === 'RATING') {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {question.questionOrder}
          </span>
          <span>{question.text} {question.required && <span className="text-red-400">*</span>}</span>
        </Label>
        <div className="flex gap-2 pl-7">
          {[1, 2, 3, 4, 5].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => onChange(String(r))}
              className={`w-12 h-12 rounded-xl border text-lg font-bold transition-all ${value === String(r) ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 glow' : 'glass border-white/10 text-muted-foreground hover:border-white/20'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.answerType === 'YES_NO') {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {question.questionOrder}
          </span>
          <span>{question.text} {question.required && <span className="text-red-400">*</span>}</span>
        </Label>
        <div className="flex gap-3 pl-7">
          {['Yes', 'No'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all ${value === opt ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 glow' : 'glass border-white/10 text-muted-foreground hover:border-white/20'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.answerType === 'DROPDOWN') {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {question.questionOrder}
          </span>
          <span>{question.text} {question.required && <span className="text-red-400">*</span>}</span>
        </Label>
        <div className="pl-7 space-y-1.5">
          {question.options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${value === opt ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'glass border-white/10 text-muted-foreground hover:border-white/20'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.answerType === 'MULTIPLE_CHOICE') {
    const selected = value ? value.split(',') : [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt];
      onChange(next.join(','));
    };
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {question.questionOrder}
          </span>
          <span>{question.text} <span className="text-xs text-muted-foreground">(select all that apply)</span> {question.required && <span className="text-red-400">*</span>}</span>
        </Label>
        <div className="pl-7 space-y-1.5">
          {question.options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border text-sm transition-all ${selected.includes(opt) ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'glass border-white/10 text-muted-foreground hover:border-white/20'}`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected.includes(opt) ? 'bg-amber-500 border-amber-500' : 'border-white/20'}`}>
                {selected.includes(opt) && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
              </div>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <div>Unknown question type: {question.answerType}</div>;
}
