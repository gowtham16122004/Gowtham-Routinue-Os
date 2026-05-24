import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  Heart,
  Sparkles,
  ShieldCheck,
  Compass,
  Award,
  ChevronRight,
  Plus,
  Flame,
  CheckCircle2,
  Calendar,
  AlertCircle
} from "lucide-react";
import { useOS } from "@/lib/os-store";
import { CircularProgress } from "@/components/ui/data-viz";
import { generateWeeklyReview } from "@/lib/ai-core";

export function IntelligenceView() {
  const { cognitiveMetrics, aiInsights, sessionHistory } = useOS();

  // Generate live weekly review from history
  const weeklyReview = useMemo(() => {
    try {
      return generateWeeklyReview();
    } catch {
      return null;
    }
  }, [sessionHistory]);

  const metrics = useMemo(() => {
    return [
      {
        name: "Cognitive Stability",
        value: cognitiveMetrics.cognitiveStability,
        desc: "Sustained attention capability and timing rhythm",
        icon: Compass,
        color: "from-blue-500/20 to-indigo-500/20",
        strokeColor: "#3b82f6"
      },
      {
        name: "Focus Integrity",
        value: cognitiveMetrics.focusIntegrity,
        desc: "Ratio of pure flow to distraction events",
        icon: ShieldCheck,
        color: "from-emerald-500/20 to-teal-500/20",
        strokeColor: "#10b981"
      },
      {
        name: "Momentum Evolution",
        value: cognitiveMetrics.momentumEvolution,
        desc: "Week-over-week performance slope",
        icon: TrendingUp,
        color: "from-violet-500/20 to-fuchsia-500/20",
        strokeColor: "#8b5cf6"
      },
      {
        name: "Deep Work Consistency",
        value: cognitiveMetrics.deepWorkConsistency,
        desc: "Frequency and routine adherence rate",
        icon: Award,
        color: "from-amber-500/20 to-orange-500/20",
        strokeColor: "#f59e0b"
      },
      {
        name: "Recovery Balance",
        value: cognitiveMetrics.recoveryBalance,
        desc: "Optimal spacing between flow and rest state",
        icon: Heart,
        color: "from-rose-500/20 to-pink-500/20",
        strokeColor: "#f43f5e"
      },
      {
        name: "Neural Alignment",
        value: cognitiveMetrics.neuralAlignment,
        desc: "Coherence with circadian focus peaks",
        icon: Zap,
        color: "from-cyan-500/20 to-sky-500/20",
        strokeColor: "#06b6d4"
      }
    ];
  }, [cognitiveMetrics]);

  return (
    <div className="space-y-6">
      {/* ── HEADER STATUS AREA ── */}
      <div className="glass relative overflow-hidden rounded-3xl p-6 border border-border/40">
        <div className="fog" style={{ top: -140, right: -120, width: 420, height: 420 }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/30 breathe">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-primary font-bold">Cognitive Engine</div>
              <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
                Neural Evolution Workspace
              </h2>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-xl">
                The behavioral operating system tracks attention fragmentations, circadian alignments, and momentum velocity to calibrate your cognitive capacity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/[0.02] ring-1 ring-white/5 rounded-2xl p-4">
            <div className="text-center px-4 border-r border-white/5">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Operator Rank</div>
              <div className="font-display text-lg font-bold text-primary mt-0.5">{cognitiveMetrics.operatorRank}</div>
            </div>
            <div className="text-center px-4 border-r border-white/5">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Deep Hours</div>
              <div className="font-display text-lg font-bold text-foreground mt-0.5">{cognitiveMetrics.totalDeepHours}h</div>
            </div>
            <div className="text-center px-2">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Current Streak</div>
              <div className="font-display text-lg font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                <Flame className="h-4 w-4 fill-amber-500/20" /> {cognitiveMetrics.currentStreak}d
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── COGNITIVE evolution CORE ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl p-6 border border-border/40 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-[16px] font-semibold text-foreground">Cognitive Evolution Metrics</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {metrics.map((m, idx) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-hover relative overflow-hidden rounded-2xl bg-white/[0.01] p-4.5 border border-border/20 flex gap-4 items-center"
                >
                  <div className={`pointer-events-none absolute -top-12 -left-12 h-24 w-24 rounded-full bg-gradient-to-br ${m.color} blur-2xl opacity-40`} />
                  <div className="relative">
                    <CircularProgress value={m.value} size={64} stroke={5} strokeColor={m.strokeColor}>
                      <div className="font-display text-xs font-bold">{m.value}%</div>
                    </CircularProgress>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <m.icon className="h-3.5 w-3.5" style={{ color: m.strokeColor }} />
                      <span className="text-[13px] font-semibold text-foreground/90 truncate">{m.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── ACTIVE AI INSIGHTS FEED ── */}
          <div className="glass rounded-3xl p-6 border border-border/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
                <h3 className="text-[16px] font-semibold text-foreground">Circadian & Behavioral Correlations</h3>
              </div>
              <span className="text-[9px] uppercase tracking-wider bg-primary/10 ring-1 ring-primary/20 text-primary px-2 py-0.5 rounded-full">
                Active Insights
              </span>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {aiInsights.map((insight, idx) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.06 }}
                  className="rounded-2xl p-4 border border-border/25 bg-white/[0.012] flex gap-3 items-start"
                >
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                    insight.category === "burnout" ? "bg-rose-500/10 text-rose-300 border border-rose-500/20" :
                    insight.category === "momentum" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                    insight.category === "recovery" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" :
                    "bg-primary/10 text-primary border border-primary/20"
                  }`}>
                    {insight.category === "burnout" ? <AlertCircle className="h-3.5 w-3.5" /> :
                     insight.category === "momentum" ? <Flame className="h-3.5 w-3.5" /> :
                     insight.category === "recovery" ? <Heart className="h-3.5 w-3.5" /> :
                     <Sparkles className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{insight.category} correlation</span>
                      <span className="text-[8.5px] font-mono text-primary/70">Conf. {Math.round(insight.confidence * 100)}%</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-foreground/80 mt-1.5">{insight.message}</p>
                  </div>
                </motion.div>
              ))}
              {aiInsights.length === 0 && (
                <div className="col-span-2 text-center py-6 text-xs text-muted-foreground">
                  Complete more deep focus blocks to trigger complex behavioral correlations.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── WEEKLY BEHAVIORAL REVIEW ENGINE ── */}
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6 border border-border/40 space-y-5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-[16px] font-semibold text-foreground">Weekly Cognitive Review</h3>
            </div>

            {weeklyReview && weeklyReview.totalSessions > 0 ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3.5 text-center">
                  <div className="rounded-2xl p-3 border border-border/20 bg-white/[0.01]">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Focus Index</div>
                    <div className="font-display text-xl font-bold text-foreground mt-1">{weeklyReview.avgFocusScore}%</div>
                  </div>
                  <div className="rounded-2xl p-3 border border-border/20 bg-white/[0.01]">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">vs Prior Week</div>
                    <div className={`font-display text-xl font-bold mt-1 flex items-center justify-center gap-1 ${
                      weeklyReview.consistencyChange >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {weeklyReview.consistencyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {Math.abs(weeklyReview.consistencyChange)}%
                    </div>
                  </div>
                  <div className="rounded-2xl p-3 border border-border/20 bg-white/[0.01]">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Burnout Risk</div>
                    <div className={`text-[12.5px] font-semibold mt-1.5 uppercase tracking-widest ${
                      weeklyReview.burnoutRisk === "high" ? "text-rose-400" :
                      weeklyReview.burnoutRisk === "moderate" ? "text-amber-400" : "text-emerald-400"
                    }`}>{weeklyReview.burnoutRisk}</div>
                  </div>
                  <div className="rounded-2xl p-3 border border-border/20 bg-white/[0.01]">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Momentum Trend</div>
                    <div className="text-[12.5px] font-semibold text-primary mt-1.5 uppercase tracking-widest">{weeklyReview.momentumTrend}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-bold">Highlights</div>
                  <ul className="space-y-2">
                    {weeklyReview.highlights.map((highlight, i) => (
                      <li key={i} className="flex gap-2 items-start text-[11.5px] text-foreground/80 leading-snug">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                    {weeklyReview.highlights.length === 0 && (
                      <li className="text-[11px] italic text-muted-foreground">No highlights recorded yet. Keep active!</li>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-bold">AI Calibrations</div>
                  <ul className="space-y-2">
                    {weeklyReview.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2 items-start text-[11.5px] text-primary/90 leading-snug">
                        <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                    {weeklyReview.recommendations.length === 0 && (
                      <li className="text-[11px] italic text-muted-foreground">Your focus habits are fully optimized. Excellent execution!</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <Brain className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-[12px] text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                  Start your first focus blocks. The AI Weekly Review requires active sessions to generate calibrations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
