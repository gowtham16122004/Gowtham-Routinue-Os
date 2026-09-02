import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Trophy, Users, Lightbulb, Minus } from "lucide-react";
import { useMemo } from "react";
import { useOS } from "@/lib/os-store";
import {
  getStrongestRoutine,
  getWeakestRoutine,
  getConsistencyTrend,
  getBestCombination,
} from "@/lib/analytics";

export function InsightsPanel() {
  const { habits, data } = useOS();
  const today = new Date().getDate();

  const hasAnyData = useMemo(() => {
    for (const h of habits) {
      for (let d = 1; d <= today; d++) {
        if (data.cells[`${h.id}:${d}`] === 1) return true;
      }
    }
    return false;
  }, [habits, data, today]);

  const strongest = useMemo(() => getStrongestRoutine(habits, data, today, 7), [habits, data, today]);
  const weakest   = useMemo(() => getWeakestRoutine(habits, data, today, 7), [habits, data, today]);
  const trend     = useMemo(() => getConsistencyTrend(habits, data, today), [habits, data, today]);
  const combo     = useMemo(() => getBestCombination(habits, data, today, 14), [habits, data, today]);

  // AI Recommendation — derived from actual weakest routine
  const recommendation = useMemo(() => {
    if (!weakest) return null;
    if (weakest.pct === 0) {
      return {
        title: "Start with consistency",
        body: `"${weakest.habit.label}" has not been completed this week. Try completing it just once today to build initial momentum.`,
      };
    }
    if (weakest.pct < 50) {
      return {
        title: `Strengthen your weakest routine`,
        body: `"${weakest.habit.label}" was completed ${weakest.count} of ${weakest.total} days. Focus on this before adding anything new.`,
      };
    }
    if (strongest && strongest.pct >= 80) {
      return {
        title: "Anchor weaker habits to strong ones",
        body: `Use "${strongest.habit.label}" as an anchor. Complete it first, then immediately move to a routine you've been skipping.`,
      };
    }
    return {
      title: "Maintain your current pace",
      body: `Your routines are progressing. Keep your current schedule and watch your consistency score rise.`,
    };
  }, [weakest, strongest]);

  // Consistency pattern text
  const trendText = useMemo(() => {
    switch (trend) {
      case "improving":
        return "Your completion is becoming more consistent across days. The upward pattern is clear.";
      case "declining":
        return "Completion has dipped compared to your earlier days this month. One solid day resets the curve.";
      case "stable":
        return "Your completion rate is holding steady. Consistency is building quietly.";
      case "insufficient":
        return null; // Don't show this card yet
    }
  }, [trend]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="glass relative overflow-hidden rounded-2xl p-6 border border-border/40"
    >
      <div className="light-streak" style={{ top: "30%", left: "-10%", width: "120%", height: 1 }} />

      {/* Header */}
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
            <Brain className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Behavioral Intelligence</div>
            <h3 className="text-[15px] font-semibold tracking-tight">Patterns detected from your routine history</h3>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-muted-foreground ring-1 ring-border/60 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
          {hasAnyData ? `Scanning ${today} days` : "Awaiting data"}
        </span>
      </div>

      {/* Empty state */}
      {!hasAnyData && (
        <div className="relative rounded-xl bg-white/[0.015] ring-1 ring-border/40 p-6 text-center">
          <Brain className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-[13px] font-medium text-muted-foreground">No routine data yet.</p>
          <p className="mt-1 text-[12px] text-muted-foreground/60">
            Complete a few routines in your checklist to unlock behavioral insights.
          </p>
        </div>
      )}

      {/* Insight cards */}
      {hasAnyData && (
        <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

          {/* CARD 1 — Strongest Habit */}
          {strongest && (
            <InsightCard
              icon={Trophy}
              tone="good"
              title="Strongest Habit"
              badge={strongest.habit.label}
            >
              Completed <strong>{strongest.count} of {strongest.total}</strong> days this week ({strongest.pct}%).
              {strongest.pct >= 80
                ? " This is your most reliable routine — protect it."
                : " Currently your top performer."}
            </InsightCard>
          )}

          {/* CARD 2 — Needs Attention */}
          {weakest && weakest.habit.id !== strongest?.habit.id && (
            <InsightCard
              icon={AlertTriangle}
              tone={weakest.pct < 30 ? "warn" : "muted"}
              title="Needs Attention"
              badge={weakest.habit.label}
            >
              Completed <strong>{weakest.count} of {weakest.total}</strong> days this week ({weakest.pct}%).
              {weakest.pct === 0
                ? " Not started this week — begin here."
                : " This is your least consistent routine right now."}
            </InsightCard>
          )}

          {/* CARD 3 — Consistency Pattern */}
          {trendText && (
            <InsightCard
              icon={trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus}
              tone={trend === "improving" ? "good" : trend === "declining" ? "warn" : "muted"}
              title="Consistency Pattern"
            >
              {trendText}
            </InsightCard>
          )}

          {/* CARD 4 — Best Combination */}
          {combo && (
            <InsightCard
              icon={Users}
              tone="primary"
              title="Best Combination"
              badge={`${combo.habitA.label} + ${combo.habitB.label}`}
            >
              These two routines were completed on the same day <strong>{combo.coOccurrences} times</strong> in the last {combo.window} days — your strongest pairing.
            </InsightCard>
          )}

          {/* CARD 5 — AI Recommendation */}
          {recommendation && (
            <InsightCard
              icon={Lightbulb}
              tone="primary"
              title={recommendation.title}
            >
              {recommendation.body}
            </InsightCard>
          )}

          {/* Low data fallback — only when very few data points */}
          {today < 4 && (
            <InsightCard
              icon={Brain}
              tone="muted"
              title="More patterns coming"
            >
              Keep tracking. Behavioral patterns become visible as your history grows over the next few days.
            </InsightCard>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── InsightCard ─────────────────────────────────────────────────────────────

function InsightCard({
  icon: Icon,
  tone,
  title,
  badge,
  children,
}: {
  icon: React.ElementType;
  tone: "good" | "warn" | "primary" | "muted";
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const iconCls =
    tone === "good"    ? "bg-emerald-400/10 ring-emerald-400/30 text-emerald-300" :
    tone === "warn"    ? "bg-amber-400/10 ring-amber-400/30 text-amber-300" :
    tone === "muted"   ? "bg-white/[0.04] ring-border/60 text-muted-foreground" :
                         "bg-primary/10 ring-primary/30 text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-hover group relative overflow-hidden rounded-xl bg-white/[0.015] p-4 ring-1 ring-border/40"
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ${iconCls}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium leading-tight text-foreground">{title}</p>
          {badge && (
            <p className="mt-1 inline-flex items-center rounded-full bg-white/[0.04] px-2 py-0.5 text-[10.5px] font-medium text-foreground/80 ring-1 ring-border/40">
              {badge}
            </p>
          )}
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{children}</p>
        </div>
      </div>
    </motion.div>
  );
}
