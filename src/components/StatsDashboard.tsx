import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Flame, Trophy, Brain, Code, Dumbbell, Target, Sparkles, Lightbulb, Zap } from "lucide-react";
import { useMemo } from "react";
import { getMonthInfo } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { AnimatedCounter, Sparkline, CircularProgress } from "@/components/ui/data-viz";
import { useOS } from "@/lib/os-store";

export function StatsDashboard() {
  const { habits, data } = useOS();
  const info = useMemo(() => getMonthInfo(), []);
  const today = new Date().getDate();

  const stats = useMemo(() => {
    const total = Math.max(1, habits.length * info.daysInMonth);
    let doneAll = 0, todayDone = 0;
    const perHabit: Record<string, number> = {};
    const perDay: number[] = Array(info.daysInMonth + 1).fill(0);
    let learningHours = 0, workHours = 0;

    habits.forEach((h) => {
      perHabit[h.id] = 0;
      for (let d = 1; d <= info.daysInMonth; d++) {
        const s = data.cells[`${h.id}:${d}`];
        if (s === 1) {
          doneAll++;
          perHabit[h.id]++;
          perDay[d]++;
          if (h.category === "learning") learningHours += 1.5;
          if (h.category === "work") workHours += 2;
        }
        if (d === today && s === 1) todayDone++;
      }
    });

    const threshold = Math.ceil(habits.length * 0.7);
    let currentStreak = 0, bestStreak = 0, run = 0;
    for (let d = 1; d <= info.daysInMonth; d++) {
      if (perDay[d] >= threshold) { run++; bestStreak = Math.max(bestStreak, run); if (d <= today) currentStreak = run; }
      else { if (d <= today) currentStreak = 0; run = 0; }
    }

    const workoutId = habits.find(h => h.category === "fitness")?.id;
    let workoutRun = 0;
    if (workoutId) {
      for (let d = today; d >= 1; d--) {
        if (data.cells[`${workoutId}:${d}`] === 1) workoutRun++; else break;
      }
    }

    const completionPct = Math.round((doneAll / total) * 100);
    const todayPct = Math.round((todayDone / Math.max(1, habits.length)) * 100);

    const sorted = Object.entries(perHabit).sort((a, b) => b[1] - a[1]);
    const best = habits.find((h) => h.id === sorted[0]?.[0]);
    const worst = habits.find((h) => h.id === sorted[sorted.length - 1]?.[0]);

    let bestDay = 1;
    for (let d = 1; d <= info.daysInMonth; d++) if (perDay[d] > perDay[bestDay]) bestDay = d;

    const xp = doneAll * 10;
    const level = Math.floor(xp / 500) + 1;
    const levelProgress = ((xp % 500) / 500) * 100;

    const last7 = perDay.slice(Math.max(1, today - 6), today + 1).reduce((a, b) => a + b, 0);
    const prev7 = perDay.slice(Math.max(1, today - 13), Math.max(1, today - 6)).reduce((a, b) => a + b, 0);
    const momentum = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);
    const spark = perDay.slice(1, today + 1);

    return {
      completionPct, todayPct, todayDone, learningHours, workHours,
      currentStreak, bestStreak, workoutRun, best, worst, bestDay,
      xp, level, levelProgress, perDay, spark, momentum,
      productivityScore: Math.min(100, Math.round((completionPct + (currentStreak / 14) * 100) / 2)),
    };
  }, [data, habits, info.daysInMonth, today]);

  const rankNames = ["Pathfinder", "Centurion", "Elite", "Apex Operator"];
  const currentRankName = rankNames[Math.min(rankNames.length - 1, stats.level - 1)];

  const cards = [
    { icon: Target, label: "Focus Integrity", value: stats.completionPct, suffix: "%", accent: "text-primary", glow: "from-primary/15", trend: stats.momentum },
    { icon: TrendingUp, label: "Discipline Index", value: stats.todayPct, suffix: "%", accent: "text-primary/90", glow: "from-primary/10" },
    { icon: Brain, label: "AI Learning", value: stats.learningHours, suffix: "h", accent: "text-primary/90", glow: "from-primary/10", decimals: 1 },
    { icon: Code, label: "Project Code", value: stats.workHours, suffix: "h", accent: "text-foreground/90", glow: "from-primary/5", decimals: 1 },
    { icon: Dumbbell, label: "Neural Load", value: Math.min(95, 12 + stats.todayDone * 6), suffix: "%", accent: "text-foreground/90", glow: "from-primary/5" },
    { icon: Flame, label: "Momentum Velocity", value: stats.currentStreak, suffix: "d", accent: "text-amber-300", glow: "from-amber-500/10" },
    { icon: Trophy, label: "Peak Streak", value: stats.bestStreak, suffix: "d", accent: "text-foreground/90", glow: "from-primary/5" },
    { icon: Sparkles, label: "Alignment Index", value: stats.productivityScore, suffix: "", accent: "text-primary", glow: "from-primary/15" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {cards.map((c, i) => (
          <motion.div key={c.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-hover group relative overflow-hidden rounded-2xl p-3.5 border border-border/40">
            <div className={cn("pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl opacity-50 transition-opacity duration-500 group-hover:opacity-90",
              c.glow, "to-transparent")} />
            <div className="relative flex items-center justify-between">
              <div className={cn("grid h-7 w-7 place-items-center rounded-lg bg-white/[0.04] ring-1 ring-white/10", c.accent)}>
                <c.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">{c.label}</span>
            </div>
            <div className="relative mt-3 flex items-end justify-between gap-2">
              <div className="font-display text-[24px] font-semibold leading-none tracking-tight">
                <AnimatedCounter value={c.value} suffix={c.suffix} decimals={c.decimals ?? 0} />
              </div>
              {typeof c.trend === "number" && (
                <span className={cn("flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                  c.trend >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300")}>
                  {c.trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(c.trend)}%
                </span>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass glass-hover relative overflow-hidden rounded-2xl p-5 border border-border/40">
          <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <CircularProgress value={stats.levelProgress} size={84} stroke={7}>
              <div className="text-center">
                <div className="font-display text-base font-bold leading-none neon-text">L{stats.level}</div>
                <div className="mt-0.5 text-[8px] uppercase tracking-wider text-muted-foreground">Rank</div>
              </div>
            </CircularProgress>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Operator Rank</p>
              <p className="font-display text-xl font-bold tracking-tight text-primary">
                {currentRankName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round(500 - (stats.xp % 500))} XP until next rank
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass glass-hover relative overflow-hidden rounded-2xl p-5 border border-border/40">
          <div className="pointer-events-none absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Momentum Velocity</p>
              <p className="font-display text-2xl font-semibold tracking-tight">
                <AnimatedCounter value={stats.spark.reduce((a, b) => a + b, 0)} /> <span className="text-sm font-normal text-muted-foreground">ticks</span>
              </p>
            </div>
            <span className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold",
              stats.momentum >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300")}>
              {stats.momentum >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(stats.momentum)}%
            </span>
          </div>
          <div className="relative mt-4 flex items-end">
            <Sparkline values={stats.spark.length ? stats.spark : [0, 0]} width={260} height={48} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass glass-hover relative overflow-hidden rounded-2xl p-5 border border-border/40">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.02]" />
          <div className="relative flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.04] ring-1 ring-white/10 breathe">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">AI Insight</p>
          </div>
          <p className="relative mt-3 text-[13px] leading-relaxed text-foreground/90">{buildInsight(stats)}</p>
          <div className="relative mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
            <Pill icon={Zap} tone="violet">Best: <b>{stats.best?.label ?? "—"}</b></Pill>
            <Pill icon={Flame} tone="orange">Focus: <b>{stats.worst?.label ?? "—"}</b></Pill>
          </div>
        </motion.div>
      </div>

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
            const v = stats.perDay[d.day] ?? 0;
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
          <span>Peak day · <b className="text-foreground">Day {stats.bestDay}</b></span>
          <span>Strongest · <b className="text-emerald-300">{stats.best?.label ?? "—"}</b></span>
          <span>Needs love · <b className="text-rose-300">{stats.worst?.label ?? "—"}</b></span>
        </div>
      </motion.div>
    </div>
  );
}

function Pill({ icon: Icon, tone, children }: { icon: React.ElementType; tone: "violet" | "orange"; children: React.ReactNode }) {
  const toneCls = tone === "violet" ? "bg-violet-500/10 text-violet-200 ring-violet-400/20" : "bg-orange-500/10 text-orange-200 ring-orange-400/20";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1", toneCls)}>
      <Icon className="h-2.5 w-2.5" /> {children}
    </span>
  );
}

function buildInsight(s: { completionPct: number; currentStreak: number; momentum: number; todayPct: number; best?: { label: string }; worst?: { label: string }; }) {
  if (s.completionPct === 0) return "Tap any cell to begin. Tiny daily ticks compound into momentum within a week.";
  if (s.currentStreak >= 5) return `You're on a ${s.currentStreak}-day streak. Protect it — finish today's ${s.worst?.label ?? "weakest"} block first.`;
  if (s.momentum > 15) return `Momentum up ${s.momentum}% week-over-week. Lock it in by repeating ${s.best?.label ?? "your strongest"} habit today.`;
  if (s.momentum < -15) return `Slight dip this week. One clean day on ${s.worst?.label ?? "your weakest habit"} will reset the curve.`;
  if (s.todayPct < 50) return "Today is open. Pick the easiest habit and tick it — momentum starts with one cell.";
  return `Steady pace at ${s.completionPct}%. Stack one more ${s.worst?.label ?? "habit"} today to break your average.`;
}
