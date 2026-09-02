import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  CheckCircle2, Circle, MinusCircle, TrendingUp, TrendingDown, ListChecks,
  Minus, Activity, BarChart2,
} from "lucide-react";
import { getMonthInfo } from "@/lib/habits";
import { AnimatedCounter, Sparkline, CircularProgress } from "@/components/ui/data-viz";
import { cn } from "@/lib/utils";
import { useOS } from "@/lib/os-store";
import {
  getTodayCompletion,
  getMomentum,
  getDisciplineIndex,
  getMonthlyCompletion,
} from "@/lib/analytics";

export function IntelligenceHero() {
  const { habits, data, setChecklistMode } = useOS();
  const info = useMemo(() => getMonthInfo(), []);
  const today = new Date().getDate();

  // ─── Today's completion ────────────────────────────────────────────────────
  const todayStats = useMemo(
    () => getTodayCompletion(habits, data, today),
    [habits, data, today]
  );

  // ─── Momentum (last 7 vs prev 7) ──────────────────────────────────────────
  const momentum = useMemo(
    () => getMomentum(habits, data, today),
    [habits, data, today]
  );

  // ─── Discipline Index ──────────────────────────────────────────────────────
  const discipline = useMemo(
    () => getDisciplineIndex(habits, data, today),
    [habits, data, today]
  );

  // ─── Monthly avg (for comparison) ─────────────────────────────────────────
  const monthlyPct = useMemo(
    () => getMonthlyCompletion(habits, data, today),
    [habits, data, today]
  );

  // ─── Sparkline data ────────────────────────────────────────────────────────
  const spark = useMemo(() => {
    const arr: number[] = [];
    for (let d = 1; d <= today; d++) {
      let done = 0;
      habits.forEach(h => { if (data.cells[`${h.id}:${d}`] === 1) done++; });
      arr.push(done);
    }
    return arr;
  }, [habits, data, today]);

  // ─── Hero headline & body ──────────────────────────────────────────────────
  const heroHeadline = useMemo(() => {
    if (habits.length === 0) return "Set up your routines to begin.";
    if (todayStats.done === 0 && todayStats.partial === 0) return "A new day begins. Start with your first routine.";
    if (todayStats.done === todayStats.total) return "Day complete. Every routine ticked off.";
    if (todayStats.pct >= 70) return "Strong progress. Keep the momentum going.";
    if (todayStats.pct >= 40) return "Your day is taking shape. Keep building.";
    return "Every tick counts. Add one more routine to the board.";
  }, [habits.length, todayStats]);

  const heroBody = useMemo(() => {
    if (habits.length === 0) return "Add your first routine to start tracking your behavior.";
    if (todayStats.done === 0 && todayStats.partial === 0) {
      return `You have ${todayStats.total} routines planned for today. Complete your first one to start building momentum.`;
    }
    const onTrackNames = todayStats.doneNames.slice(0, 3).join(", ");
    const remaining = todayStats.remaining;
    const extraDone = todayStats.doneNames.length > 3 ? ` and ${todayStats.doneNames.length - 3} more` : "";
    if (todayStats.done === todayStats.total) {
      return `All ${todayStats.total} routines completed today. Outstanding consistency.`;
    }
    return `${todayStats.done} of ${todayStats.total} routines completed today.${onTrackNames ? ` ${onTrackNames}${extraDone} are done.` : ""} ${remaining > 0 ? `${remaining} remaining.` : ""}`;
  }, [habits.length, todayStats]);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* ── HERO CARD ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative col-span-12 overflow-hidden rounded-2xl p-6 lg:col-span-7 border border-border/40"
      >
        <div className="light-streak" style={{ top: "20%", left: "-20%", width: "140%", height: 1 }} />
        <div className="fog" style={{ top: -120, right: -120, width: 360, height: 360 }} />

        <div className="relative flex items-start gap-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30 breathe">
            <Activity className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Date label */}
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-primary pulse-dot" />
              Daily Status · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </div>

            {/* Headline */}
            <h2 className="mt-2 font-display text-[22px] leading-tight tracking-tight md:text-[26px] text-foreground">
              {heroHeadline}
            </h2>

            {/* Body */}
            <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              {heroBody}
            </p>

            {/* Status indicators */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusPill
                icon={CheckCircle2}
                label={`${todayStats.done} Done`}
                tone="green"
              />
              {todayStats.partial > 0 && (
                <StatusPill
                  icon={MinusCircle}
                  label={`${todayStats.partial} Partial`}
                  tone="yellow"
                />
              )}
              <StatusPill
                icon={Circle}
                label={`${todayStats.remaining} Remaining`}
                tone="muted"
              />

              {/* Open Checklist CTA */}
              <button
                id="open-checklist-btn"
                onClick={() => setChecklistMode(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 ring-1 ring-primary/40 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/25 hover:ring-primary/60 transition-all duration-200 shadow-[0_0_12px_-4px_color-mix(in_oklab,var(--primary)_50%,transparent)]"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Open Today's Checklist
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── TODAY'S PROGRESS CARD ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="glass relative col-span-12 overflow-hidden rounded-2xl p-6 sm:col-span-6 lg:col-span-3 border border-border/40"
      >
        <div className="fog" style={{ top: -80, left: -60, width: 240, height: 240 }} />
        <div className="relative flex items-center justify-between mb-4">
          <div className="text-[9px] uppercase font-bold tracking-[0.18em] text-muted-foreground">Today's Progress</div>
          <BarChart2 className="h-3.5 w-3.5 text-primary/60" />
        </div>

        <div className="relative flex items-center gap-4">
          <CircularProgress value={todayStats.pct} size={84} stroke={6}>
            <div className="text-center">
              <div className="font-display text-lg font-bold leading-none">
                <AnimatedCounter value={todayStats.pct} suffix="%" />
              </div>
              <div className="mt-0.5 text-[8px] uppercase tracking-wider text-muted-foreground">today</div>
            </div>
          </CircularProgress>

          <div className="flex-1 space-y-0.5">
            <MetricRow label="Completed" value={`${todayStats.done} / ${todayStats.total}`} />
            {todayStats.partial > 0 && (
              <MetricRow label="Partial" value={`${todayStats.partial}`} tone="yellow" />
            )}
            <MetricRow label="Missed" value={`${todayStats.missed}`} tone={todayStats.missed > 0 ? "red" : undefined} />
            {today > 1 && (
              <MetricRow
                label={info.monthName + " avg"}
                value={`${monthlyPct}%`}
                tone={todayStats.pct >= monthlyPct ? "green" : undefined}
              />
            )}
          </div>
        </div>

        {today > 1 && todayStats.total > 0 && (
          <p className="relative mt-3 text-[10.5px] text-muted-foreground">
            {todayStats.pct > monthlyPct
              ? `Above your ${info.monthName} average (${monthlyPct}%)`
              : todayStats.pct === monthlyPct
              ? `Matching your ${info.monthName} average`
              : `Below your ${info.monthName} average (${monthlyPct}%)`}
          </p>
        )}
      </motion.div>

      {/* ── MOMENTUM CARD ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="glass relative col-span-12 overflow-hidden rounded-2xl p-6 sm:col-span-6 lg:col-span-2 border border-border/40"
      >
        <div className="relative flex items-center justify-between">
          <div className="text-[9px] uppercase font-bold tracking-[0.18em] text-muted-foreground">Momentum</div>
          {momentum.hasEnoughData && (
            <span className={cn(
              "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
              momentum.direction === "up" ? "bg-emerald-400/10 text-emerald-300" :
              momentum.direction === "down" ? "bg-rose-400/10 text-rose-300" :
              "bg-white/[0.04] text-muted-foreground"
            )}>
              {momentum.direction === "up" ? <TrendingUp className="h-2.5 w-2.5" /> :
               momentum.direction === "down" ? <TrendingDown className="h-2.5 w-2.5" /> :
               <Minus className="h-2.5 w-2.5" />}
              {momentum.pct}%
            </span>
          )}
        </div>

        {momentum.hasEnoughData ? (
          <>
            <div className="relative mt-3 font-display text-2xl font-semibold leading-none tracking-tight">
              {momentum.direction === "up" ? "+" : momentum.direction === "down" ? "-" : ""}
              <AnimatedCounter value={momentum.pct} suffix="%" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">vs previous 7 days</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {momentum.direction === "up" ? "Your consistency is improving." :
               momentum.direction === "down" ? "Slight dip — one strong day resets the curve." :
               "Holding steady this week."}
            </p>
          </>
        ) : (
          <>
            <div className="relative mt-3 font-display text-xl font-semibold leading-none tracking-tight text-muted-foreground">
              Building
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {today < 8
                ? `${8 - today} more day${8 - today !== 1 ? "s" : ""} to unlock trend`
                : "Keep tracking to see your momentum."}
            </p>
          </>
        )}

        <div className="relative mt-3 -mx-2">
          <Sparkline values={spark.length >= 2 ? spark : [0, 0]} width={180} height={42} color="var(--primary)" />
        </div>
      </motion.div>
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  tone: "green" | "yellow" | "muted";
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] ring-1",
      tone === "green" && "bg-emerald-400/8 text-emerald-300 ring-emerald-400/25",
      tone === "yellow" && "bg-amber-400/8 text-amber-300 ring-amber-400/25",
      tone === "muted" && "bg-white/[0.03] text-muted-foreground ring-border/50",
    )}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function MetricRow({ label, value, tone }: { label: string; value: string; tone?: "green" | "yellow" | "red" }) {
  return (
    <div className="flex items-center justify-between py-1 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        "font-mono font-medium",
        tone === "green" && "text-emerald-300",
        tone === "yellow" && "text-amber-300",
        tone === "red" && "text-rose-300",
        !tone && "text-foreground/90",
      )}>{value}</span>
    </div>
  );
}
