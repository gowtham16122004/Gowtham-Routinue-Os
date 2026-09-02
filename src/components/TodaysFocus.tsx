import { motion } from "framer-motion";
import { Target, ListChecks, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useOS } from "@/lib/os-store";
import { getTodayCompletion, getWeakestRoutine } from "@/lib/analytics";

export function TodaysFocus() {
  const { habits, data, setChecklistMode } = useOS();
  const today = new Date().getDate();

  const todayStats = useMemo(() => getTodayCompletion(habits, data, today), [habits, data, today]);
  const nextPriority = useMemo(() => getWeakestRoutine(habits, data, today, 7), [habits, data, today]);

  // Don't show if there are no habits at all
  if (habits.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass relative overflow-hidden rounded-2xl border border-border/40"
    >
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">

        {/* Left — Today label + completion */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] uppercase font-bold tracking-[0.18em] text-muted-foreground">Today's Focus</div>
            <p className="text-[13px] font-semibold text-foreground mt-0.5">
              {todayStats.done === 0
                ? "No routines completed yet"
                : todayStats.done === todayStats.total
                ? `All ${todayStats.total} routines complete ✓`
                : `${todayStats.done} of ${todayStats.total} routines completed`}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-10 w-px bg-border/40" />

        {/* Center — Next Priority */}
        {nextPriority && todayStats.done < todayStats.total && (
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase font-bold tracking-[0.18em] text-muted-foreground">Next Priority</div>
            <p className="text-[13px] font-semibold text-foreground mt-0.5 truncate">
              {nextPriority.habit.label}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {nextPriority.pct === 0
                ? "Not started this week"
                : `${nextPriority.pct}% this week — your least consistent routine`}
            </p>
          </div>
        )}

        {todayStats.done === todayStats.total && (
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-emerald-300 font-medium">Outstanding day — all routines done.</p>
          </div>
        )}

        {/* Right — CTA */}
        <button
          id="todays-focus-checklist-btn"
          onClick={() => setChecklistMode(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary/12 ring-1 ring-primary/35 px-4 py-2.5 text-[12px] font-semibold text-primary hover:bg-primary/22 hover:ring-primary/55 transition-all duration-200"
        >
          <ListChecks className="h-3.5 w-3.5" />
          View Checklist
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}
