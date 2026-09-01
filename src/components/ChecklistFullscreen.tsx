import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ArrowLeft, Check, ChevronLeft, ChevronRight,
  Minus, X, Smile, Meh, Moon, Sparkles,
} from "lucide-react";
import { useOS } from "@/lib/os-store";
import {
  getMonthInfo,
  type CellState,
  type Mood,
  type Habit,
} from "@/lib/habits";
import { cn } from "@/lib/utils";

/* ─── cell cycle helpers ─────────────────────────────────── */
const STATE_CYCLE: CellState[] = [0, 1, 2, 3];

function CellIcon({ state }: { state: CellState }) {
  if (state === 0) return null;
  if (state === 1)
    return (
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 18 }}
      >
        <Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} />
      </motion.div>
    );
  if (state === 2) return <Minus className="h-3 w-3 text-amber-300" strokeWidth={3} />;
  return <X className="h-3 w-3 text-rose-300" strokeWidth={3} />;
}

/* ─── main component ─────────────────────────────────────── */
export function ChecklistFullscreen() {
  const {
    habits, data, setData,
    setChecklistMode,
    selectedMonth, selectedYear, setSelectedMonth,
    mode,
  } = useOS();

  const [hover, setHover] = useState<{
    habitId: string; day: number; x: number; y: number;
  } | null>(null);
  const [ripple, setRipple] = useState<{ key: string; id: number } | null>(null);

  const today = new Date().getDate();
  const info = getMonthInfo(new Date(selectedYear, selectedMonth, 1));
  const isCurrentMonth =
    selectedMonth === new Date().getMonth() &&
    selectedYear === new Date().getFullYear();

  /* month navigation */
  const goToPrevMonth = () => {
    const d = new Date(selectedYear, selectedMonth - 1, 1);
    setSelectedMonth(d.getMonth(), d.getFullYear());
  };
  const goToNextMonth = () => {
    const next = new Date(selectedYear, selectedMonth + 1, 1);
    const now = new Date();
    if (
      next.getFullYear() > now.getFullYear() ||
      (next.getFullYear() === now.getFullYear() && next.getMonth() > now.getMonth())
    ) return;
    setSelectedMonth(next.getMonth(), next.getFullYear());
  };
  const isNextDisabled = (() => {
    const now = new Date();
    return (
      selectedYear > now.getFullYear() ||
      (selectedYear === now.getFullYear() && selectedMonth >= now.getMonth())
    );
  })();

  /* cell toggle */
  const toggle = (habitId: string, day: number) => {
    const key = `${habitId}:${day}`;
    const current = data.cells[key] ?? 0;
    const nextState =
      STATE_CYCLE[(STATE_CYCLE.indexOf(current as CellState) + 1) % STATE_CYCLE.length];
    const cells = { ...data.cells };
    if (nextState === 0) delete cells[key];
    else cells[key] = nextState;
    if (nextState === 1) setRipple({ key, id: Date.now() });
    setData({ ...data, cells });
  };

  const setMood = (day: number, mood: Mood) => {
    setData({ ...data, meta: { ...data.meta, [day]: { ...data.meta[day], mood } } });
  };

  /* progress stats */
  const { done, partial, missed, total, pct } = useMemo(() => {
    const upToDay = isCurrentMonth ? today : info.daysInMonth;
    let done = 0, partial = 0, missed = 0;
    for (const h of habits) {
      for (let d = 1; d <= upToDay; d++) {
        const s = data.cells[`${h.id}:${d}`] ?? 0;
        if (s === 1) done++;
        else if (s === 2) partial++;
        else if (s === 3) missed++;
      }
    }
    const total = habits.length * upToDay;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, partial, missed, total, pct };
  }, [data, habits, today, info.daysInMonth, isCurrentMonth]);

  const hasData = Object.keys(data.cells).length > 0;

  const hoveredHabit = hover ? habits.find(h => h.id === hover.habitId) : null;
  const hoveredDay   = hover ? info.days.find(d => d.day === hover.day) : null;
  const hoveredState = hover ? (data.cells[`${hover.habitId}:${hover.day}`] ?? 0) : 0;
  const hoveredMood  = hover ? data.meta[hover.day]?.mood : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Minimal top bar ─────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 py-3">

          {/* Routine OS brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary/80 to-primary/30 shadow-[0_0_14px_-4px_color-mix(in_oklab,var(--primary)_60%,transparent)]">
              <Activity className="h-3.5 w-3.5 text-white" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
            </div>
            <span className="font-display text-[13px] font-semibold tracking-tight">Routine OS</span>
            <span className="hidden sm:inline text-[10px] text-muted-foreground/60 ml-1">· Checklist</span>
          </div>

          <span className="h-4 w-px bg-border/50 mx-1" />

          {/* Month navigator */}
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] ring-1 ring-border/50 p-1">
            <button
              onClick={goToPrevMonth}
              className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-[11px] font-medium text-foreground/90 min-w-[120px] text-center">
              {info.monthName} {info.year}
              {isCurrentMonth && (
                <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-bold text-primary uppercase tracking-wider">
                  now
                </span>
              )}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={isNextDisabled}
              className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress summary */}
          <div className="hidden md:flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.02] ring-1 ring-border/40 px-3 py-1.5">
              <span className="font-display text-lg font-bold text-primary leading-none">{pct}%</span>
              <span className="text-muted-foreground">{info.monthName} completion</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{done} done
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{partial} partial
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />{missed} missed
              </span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Back button */}
          <button
            id="back-to-dashboard-btn"
            onClick={() => setChecklistMode(false)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition-colors ring-1 ring-border/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
        </div>

        {/* Monthly progress bar */}
        <div className="h-[2px] bg-white/[0.03]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-gradient-to-r from-primary/70 to-primary/30"
          />
        </div>
      </div>

      {/* ── Behavioral Matrix ────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {/* Empty state */}
        {!isCurrentMonth && !hasData ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-4xl mb-4">📭</div>
              <div className="text-[15px] font-medium text-foreground/80 mb-2">
                No data for {info.monthName} {info.year}
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-5">
                No routine data was recorded for this month.
              </p>
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedMonth(now.getMonth(), now.getFullYear());
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 ring-1 ring-primary/40 px-4 py-2 text-[12px] font-medium text-primary hover:bg-primary/25 transition-colors"
              >
                Go to Current Month
              </button>
            </div>
          </div>
        ) : (
          /* Matrix table — takes all remaining space */
          <div className="relative overflow-x-auto overflow-y-auto h-[calc(100vh-80px)] scrollbar-thin">
            <table className="w-full border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-20">
                <tr>
                  <th className="sticky left-0 z-30 w-[220px] bg-card/98 px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur border-b border-border/50">
                    Routine
                  </th>
                  {info.weekGroups.map((w) => (
                    <th
                      key={w.week}
                      colSpan={w.end - w.start + 1}
                      className="border-l border-b border-border/40 bg-card/90 px-2 py-2 text-center text-[9.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur"
                    >
                      Week {w.week}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="sticky left-0 z-30 bg-card/98 px-4 py-1 text-left text-[9.5px] uppercase text-muted-foreground backdrop-blur border-b border-border/40">
                    Day
                  </th>
                  {info.days.map((d) => (
                    <th
                      key={`wd-${d.day}`}
                      className={cn(
                        "grid-cell w-9 px-0 py-1 text-center text-[9.5px] font-medium uppercase border-b border-border/40",
                        d.isWeekend ? "text-primary/70" : "text-muted-foreground/70",
                        d.isToday && "bg-primary/15 text-foreground"
                      )}
                    >
                      {d.weekday.charAt(0)}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="sticky left-0 z-30 bg-card/98 px-4 py-1 text-left text-[9.5px] uppercase text-muted-foreground backdrop-blur border-b border-border/40">
                    Date
                  </th>
                  {info.days.map((d) => (
                    <th
                      key={`dt-${d.day}`}
                      className={cn(
                        "grid-cell w-9 px-0 py-1 text-center text-[10.5px] font-mono font-semibold border-b border-border/40",
                        d.isToday
                          ? "bg-primary text-primary-foreground accent-glow"
                          : "bg-card/60 text-foreground/80"
                      )}
                    >
                      {d.day}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {habits.map((h: Habit, idx: number) => (
                  <tr key={h.id} className="group">
                    {/* Routine label — sequence number + name */}
                    <td
                      className={cn(
                        "sticky left-0 z-10 border-t border-border/30 px-4 py-2 backdrop-blur",
                        idx % 2 === 0 ? "bg-card/98" : "bg-card/85"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono font-bold text-primary/50 tabular-nums w-5 shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[13px] font-medium leading-tight text-foreground/92">
                          {h.label}
                        </span>
                      </div>
                    </td>

                    {/* Day cells */}
                    {info.days.map((d) => {
                      const key = `${h.id}:${d.day}`;
                      const state = (data.cells[key] ?? 0) as CellState;

                      const hasLeftDone  = d.day > 1 && data.cells[`${h.id}:${d.day - 1}`] === 1;
                      const hasRightDone = d.day < info.daysInMonth && data.cells[`${h.id}:${d.day + 1}`] === 1;

                      let activeClass = "";
                      if (state === 1) {
                        activeClass =
                          mode === "operator"
                            ? "bg-emerald-500/18 shadow-[inset_0_0_8px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
                            : mode === "recovery"
                            ? "bg-amber-500/18"
                            : "bg-emerald-500/12";
                      } else if (state === 2) activeClass = "bg-amber-500/12";
                      else if (state === 3) activeClass = "bg-rose-500/12";

                      return (
                        <td
                          key={key}
                          className={cn(
                            "grid-cell relative h-10 w-9 cursor-pointer p-0 text-center transition-all duration-200",
                            d.isWeekend && "bg-primary/[0.025]",
                            d.isToday && "bg-primary/[0.08]",
                            activeClass,
                            "hover:bg-primary/20 hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
                          )}
                          onClick={() => toggle(h.id, d.day)}
                          onMouseEnter={(e) => {
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setHover({ habitId: h.id, day: d.day, x: r.left + r.width / 2, y: r.top });
                          }}
                          onMouseLeave={() => setHover(null)}
                        >
                          {state === 1 && hasLeftDone  && <div className="streak-connector-left" />}
                          {state === 1 && hasRightDone && <div className="streak-connector-right" />}

                          <div className="relative flex h-full w-full items-center justify-center z-10">
                            <AnimatePresence mode="wait">
                              <CellIcon key={state} state={state} />
                            </AnimatePresence>

                            {ripple?.key === key && (
                              <motion.span
                                key={ripple.id}
                                initial={{ scale: 0, opacity: 0.6 }}
                                animate={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 0.65, ease: "easeOut" }}
                                onAnimationComplete={() => setRipple(null)}
                                className="pointer-events-none absolute inset-0 rounded-full bg-primary/45"
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Mood row */}
                <tr>
                  <td className="sticky left-0 z-10 border-t border-border/50 bg-card/98 px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground backdrop-blur">
                    Mood
                  </td>
                  {info.days.map((d) => {
                    const mood = data.meta[d.day]?.mood ?? null;
                    return (
                      <td key={`m-${d.day}`} className="grid-cell h-9 w-9 p-0 border-t border-border/30">
                        <button
                          type="button"
                          onClick={() => {
                            const next: Mood =
                              mood === "great" ? "ok"
                              : mood === "ok" ? "low"
                              : mood === "low" ? null
                              : "great";
                            setMood(d.day, next);
                          }}
                          className="flex h-full w-full items-center justify-center hover:bg-primary/15 transition-colors"
                          aria-label={`Mood for day ${d.day}`}
                        >
                          {mood === "great" && <Smile className="h-3.5 w-3.5 text-emerald-300" />}
                          {mood === "ok"    && <Meh   className="h-3.5 w-3.5 text-amber-300" />}
                          {mood === "low"   && <Moon  className="h-3.5 w-3.5 text-indigo-300" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Hover tooltip ───────────────────────────────────── */}
      <AnimatePresence>
        {hover && hoveredHabit && hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "fixed",
              left: hover.x,
              top: hover.y - 12,
              transform: "translate(-50%, -100%)",
            }}
            className="pointer-events-none z-50 w-[220px] rounded-xl glass-strong p-3 border border-primary/20 ring-soft"
          >
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              <span>{hoveredDay.weekdayLong}, {info.monthName} {hoveredDay.day}</span>
              <span className="flex items-center gap-1 text-primary font-bold">
                <Sparkles className="h-2.5 w-2.5" /> AI
              </span>
            </div>
            <div className="mt-1.5 text-[13px] font-semibold text-foreground leading-tight">
              {hoveredHabit.label}
            </div>
            <div className="mt-0.5 text-[9px] font-mono text-muted-foreground">
              Routine #{habits.findIndex(h => h.id === hoveredHabit.id) + 1}
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[9px]">
              <MiniStat
                label="Status"
                value={["—", "Done ✓", "Partial", "Missed"][hoveredState]}
                color={["text-muted-foreground", "text-emerald-300", "text-amber-300", "text-rose-300"][hoveredState]}
              />
              <MiniStat
                label="Mood"
                value={hoveredMood ? `${hoveredMood}` : "—"}
                color="text-foreground/80"
              />
            </div>
            {hoveredState === 0 && (
              <p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
                Click to mark as <span className="text-emerald-300 font-medium">Done</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legend footer ───────────────────────────────────── */}
      <div className="sticky bottom-0 border-t border-border/30 bg-background/90 backdrop-blur-sm py-2 px-5">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between">
          <div className="flex items-center gap-5 text-[10.5px] text-muted-foreground">
            <Legend dot="bg-emerald-400/80" label="Done" />
            <Legend dot="bg-amber-400/80"   label="Partial" />
            <Legend dot="bg-rose-400/80"    label="Missed" />
            <span className="text-muted-foreground/50">· click to cycle</span>
          </div>
          {/* Mobile stats */}
          <div className="flex md:hidden items-center gap-1 text-[11px]">
            <span className="font-display font-bold text-primary">{pct}%</span>
            <span className="text-muted-foreground">complete</span>
          </div>
          <button
            onClick={() => setChecklistMode(false)}
            className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md bg-white/[0.025] border border-border/25 px-2 py-1">
      <div className="text-muted-foreground/60 uppercase tracking-wider text-[7.5px]">{label}</div>
      <div className={cn("mt-0.5 font-medium leading-snug capitalize", color)}>{value}</div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-sm", dot)} />
      {label}
    </span>
  );
}
