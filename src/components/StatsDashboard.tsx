import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Flame, Trophy, Target, CheckSquare, Sparkles, Activity, AlertCircle, Minus } from "lucide-react";
import { useMemo } from "react";
import { getMonthInfo } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { AnimatedCounter, Sparkline, CircularProgress } from "@/components/ui/data-viz";
import { useOS } from "@/lib/os-store";
import {
  getTodayCompletion,
  getWeeklyCompletion,
  getCurrentStreak,
  getMomentum,
  getDisciplineIndex,
  getStrongestRoutine,
  getWeakestRoutine,
  getMonthlyCompletion,
} from "@/lib/analytics";

export function StatsDashboard() {
  const { habits, data } = useOS();
  const info = useMemo(() => getMonthInfo(), []);
  const today = new Date().getDate();

  // ─── All analytics from real data ─────────────────────────────────────────
  const todayStats  = useMemo(() => getTodayCompletion(habits, data, today), [habits, data, today]);
  const weekly      = useMemo(() => getWeeklyCompletion(habits, data, today, 7), [habits, data, today]);
  const streak      = useMemo(() => getCurrentStreak(habits, data, today), [habits, data, today]);
  const momentum    = useMemo(() => getMomentum(habits, data, today), [habits, data, today]);
  const discipline  = useMemo(() => getDisciplineIndex(habits, data, today), [habits, data, today]);
  const strongest   = useMemo(() => getStrongestRoutine(habits, data, today, 7), [habits, data, today]);
  const weakest     = useMemo(() => getWeakestRoutine(habits, data, today, 7), [habits, data, today]);
  const monthly     = useMemo(() => getMonthlyCompletion(habits, data, today), [habits, data, today]);

  // ─── Per-day totals for heatmap and sparkline ──────────────────────────────
  const { perDay, spark, bestDay } = useMemo(() => {
    const perDay: number[] = Array(info.daysInMonth + 1).fill(0);
    habits.forEach(h => {
      for (let d = 1; d <= info.daysInMonth; d++) {
        if (data.cells[`${h.id}:${d}`] === 1) perDay[d]++;
      }
    });
    let bestDay = 1;
    for (let d = 1; d <= info.daysInMonth; d++) {
      if (perDay[d] > perDay[bestDay]) bestDay = d;
    }
    const spark = perDay.slice(1, today + 1);
    return { perDay, spark, bestDay };
  }, [data, habits, info.daysInMonth, today]);

  // ─── XP / level system ────────────────────────────────────────────────────
  const { xp, level, levelProgress, rankName } = useMemo(() => {
    let doneAll = 0;
    habits.forEach(h => {
      for (let d = 1; d <= info.daysInMonth; d++) {
        if (data.cells[`${h.id}:${d}`] === 1) doneAll++;
      }
    });
    const xp = doneAll * 10;
    const level = Math.floor(xp / 500) + 1;
    const levelProgress = ((xp % 500) / 500) * 100;
    const rankNames = ["Pathfinder", "Centurion", "Elite", "Apex Operator"];
    const rankName = rankNames[Math.min(rankNames.length - 1, level - 1)];
    return { xp, level, levelProgress, rankName };
  }, [data, habits, info.daysInMonth]);

  // ─── Metric cards ─────────────────────────────────────────────────────────
  const cards = [
    {
      icon: CheckSquare,
      label: "Today's Completion",
      display: `${todayStats.done}/${todayStats.total}`,
      subtext: `${todayStats.pct}% done`,
      accent: "text-primary",
      glow: "from-primary/15",
      isText: true,
    },
    {
      icon: Activity,
      label: "Discipline Index",
      value: discipline.score,
      suffix: "",
      subtext: discipline.label,
      accent: "text-primary/90",
      glow: "from-primary/10",
    },
    {
      icon: Target,
      label: "Consistency",
      value: discipline.consistency,
      suffix: "%",
      subtext: "days at 70%+ target",
      accent: "text-primary/90",
      glow: "from-primary/10",
    },
    {
      icon: Trophy,
      label: "Best Habit",
      display: strongest?.habit.label ?? "—",
      subtext: strongest ? `${strongest.pct}% this week` : "No data yet",
      accent: "text-emerald-300",
      glow: "from-emerald-500/10",
      isText: true,
    },
    {
      icon: AlertCircle,
      label: "Needs Attention",
      display: weakest?.habit.label ?? "—",
      subtext: weakest ? `${weakest.pct}% this week` : "No data yet",
      accent: "text-amber-300",
      glow: "from-amber-500/10",
      isText: true,
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: streak,
      suffix: streak === 1 ? "d" : "d",
      subtext: streak >= 7 ? "Outstanding!" : streak >= 3 ? "Building nicely" : streak === 0 ? "Start today" : "Keep going",
      accent: "text-amber-300",
      glow: "from-amber-500/10",
    },
    {
      icon: TrendingUp,
      label: "Weekly Completion",
      value: weekly,
      suffix: "%",
      subtext: "last 7 days",
      accent: "text-foreground/90",
      glow: "from-primary/5",
    },
    {
      icon: Sparkles,
      label: "Momentum",
      value: momentum.hasEnoughData ? momentum.pct : monthly,
      suffix: "%",
      subtext: momentum.hasEnoughData
        ? (momentum.direction === "up" ? "↑ vs prev 7 days" : momentum.direction === "down" ? "↓ vs prev 7 days" : "→ stable this week")
        : `${info.monthName} avg`,
      accent: momentum.hasEnoughData
        ? (momentum.direction === "up" ? "text-emerald-300" : momentum.direction === "down" ? "text-rose-300" : "text-foreground/90")
        : "text-primary",
      glow: "from-primary/15",
    },
  ] as const;

  return (
    <div className="space-y-5">
      {/* ── Small metric grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {cards.map((c, i) => (
          <motion.div key={c.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-hover group relative overflow-hidden rounded-2xl p-3.5 border border-border/40"
          >
            <div className={cn("pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl opacity-50 transition-opacity duration-500 group-hover:opacity-90",
              c.glow, "to-transparent")} />
            <div className="relative flex items-center justify-between">
              <div className={cn("grid h-7 w-7 place-items-center rounded-lg bg-white/[0.04] ring-1 ring-white/10", c.accent)}>
                <c.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80 text-right leading-tight ml-1">
                {c.label}
              </span>
            </div>
            <div className="relative mt-3">
              {"isText" in c && c.isText ? (
                <div className="font-display text-[14px] font-semibold leading-tight tracking-tight truncate" title={"display" in c ? c.display : ""}>
                  {"display" in c ? c.display : ""}
                </div>
              ) : (
                <div className="font-display text-[24px] font-semibold leading-none tracking-tight">
                  {"value" in c && <AnimatedCounter value={c.value} suffix={"suffix" in c ? c.suffix : ""} />}
                </div>
              )}
              {"subtext" in c && c.subtext && (
                <div className="mt-1 text-[9.5px] text-muted-foreground truncate">{c.subtext}</div>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>

      {/* ── Medium cards row ───────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Operator Rank */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass glass-hover relative overflow-hidden rounded-2xl p-5 border border-border/40">
          <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <CircularProgress value={levelProgress} size={84} stroke={7}>
              <div className="text-center">
                <div className="font-display text-base font-bold leading-none neon-text">L{level}</div>
                <div className="mt-0.5 text-[8px] uppercase tracking-wider text-muted-foreground">Rank</div>
              </div>
            </CircularProgress>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Operator Rank</p>
              <p className="font-display text-xl font-bold tracking-tight text-primary">{rankName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round(500 - (xp % 500))} XP until next rank
              </p>
            </div>
          </div>
        </motion.div>

        {/* Weekly Trend + Sparkline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass glass-hover relative overflow-hidden rounded-2xl p-5 border border-border/40">
          <div className="pointer-events-none absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Weekly Trend</p>
              <p className="font-display text-2xl font-semibold tracking-tight">
                <AnimatedCounter value={weekly} suffix="%" />
                {" "}
                <span className="text-sm font-normal text-muted-foreground">this week</span>
              </p>
            </div>
            {momentum.hasEnoughData && (
              <span className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold",
                momentum.direction === "up" ? "bg-emerald-500/10 text-emerald-300" :
                momentum.direction === "down" ? "bg-rose-500/10 text-rose-300" :
                "bg-white/[0.04] text-muted-foreground"
              )}>
                {momentum.direction === "up" ? <TrendingUp className="h-3 w-3" /> :
                 momentum.direction === "down" ? <TrendingDown className="h-3 w-3" /> :
                 <Minus className="h-3 w-3" />}
                {momentum.direction !== "flat" ? `${momentum.pct}%` : "Stable"}
              </span>
            )}
          </div>
          <div className="relative mt-4 flex items-end">
            <Sparkline values={spark.length ? spark : [0, 0]} width={260} height={48} />
          </div>
        </motion.div>

        {/* Discipline Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass glass-hover relative overflow-hidden rounded-2xl p-5 border border-border/40">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.02]" />
          <div className="relative flex items-center gap-2 mb-4">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.04] ring-1 ring-white/10 breathe">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Discipline Index</p>
              <p className="font-display text-xl font-semibold tracking-tight">
                {discipline.score} <span className="text-sm font-normal text-muted-foreground">· {discipline.label}</span>
              </p>
            </div>
          </div>
          <div className="relative space-y-2">
            <DisciplineBar label="Consistency" value={discipline.consistency} color="bg-primary" />
            <DisciplineBar label="Completion" value={discipline.completion} color="bg-emerald-400" />
            <DisciplineBar label="Stability" value={discipline.stability} color="bg-amber-400" />
          </div>
          {discipline.score === 0 && (
            <p className="relative mt-3 text-[11px] text-muted-foreground/70">
              Complete routines in your checklist to build your index.
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Consistency Heatmap ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="glass relative overflow-hidden rounded-2xl p-5 border border-border/40">
        <div className="pointer-events-none absolute -top-10 right-1/4 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Consistency Heatmap</p>
            <p className="mt-0.5 text-sm font-medium text-foreground/90">Daily completion across {info.monthName}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>less</span>
            <span className="h-2.5 w-2.5 rounded-sm bg-secondary" />
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
            <span className="h-2.5 w-2.5 rounded-sm bg-primary accent-glow" />
            <span>more</span>
          </div>
        </div>
        <div className="relative flex flex-wrap gap-1.5">
          {info.days.map((d, i) => {
            const v = perDay[d.day] ?? 0;
            const ratio = v / Math.max(1, habits.length);
            const bg = ratio === 0 ? "bg-secondary/70"
              : ratio < 0.34 ? "bg-primary/35"
              : ratio < 0.67 ? "bg-primary/65"
              : "bg-primary accent-glow";
            return (
              <motion.div key={d.day}
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.012 }}
                className={cn("grid h-7 w-7 place-items-center rounded-md text-[10px] font-mono transition-all duration-200 hover:scale-110 hover:ring-1 hover:ring-primary/60",
                  bg, d.isToday && "ring-1 ring-primary")}
                title={`Day ${d.day}: ${v}/${habits.length}`}>
                {d.day}
              </motion.div>
            );
          })}
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>Peak day · <b className="text-foreground">Day {bestDay}</b></span>
          <span>Strongest · <b className="text-emerald-300">{strongest?.habit.label ?? "—"}</b></span>
          <span>Needs attention · <b className="text-rose-300">{weakest?.habit.label ?? "—"}</b></span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── DisciplineBar ────────────────────────────────────────────────────────────

function DisciplineBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium text-foreground/90">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}
