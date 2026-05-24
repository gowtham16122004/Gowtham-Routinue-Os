import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, X, Smile, Meh, Moon, Sparkles } from "lucide-react";
import {
  getMonthInfo,
  type CellState,
  type Mood,
  type Habit,
  type MonthData,
} from "@/lib/habits";
import { cn } from "@/lib/utils";
import { useOS } from "@/lib/os-store";

const STATE_CYCLE: CellState[] = [0, 1, 2, 3];

function CellIcon({ state }: { state: CellState }) {
  if (state === 0) return null;
  if (state === 1)
    return (
      <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 16 }}>
        <Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} />
      </motion.div>
    );
  if (state === 2) return <Minus className="h-3 w-3 text-amber-300" strokeWidth={3} />;
  return <X className="h-3 w-3 text-rose-300" strokeWidth={3} />;
}

export function HabitTracker() {
  const { habits, data, setData, mode } = useOS();
  const info = getMonthInfo();
  const [hover, setHover] = useState<{ habitId: string; day: number; x: number; y: number } | null>(null);
  const [ripple, setRipple] = useState<{ key: string; id: number } | null>(null);

  const update = (next: MonthData) => setData(next);

  const toggle = (habitId: string, day: number) => {
    const key = `${habitId}:${day}`;
    const current = data.cells[key] ?? 0;
    const nextState = STATE_CYCLE[(STATE_CYCLE.indexOf(current) + 1) % STATE_CYCLE.length];
    const cells = { ...data.cells };
    if (nextState === 0) delete cells[key];
    else cells[key] = nextState;
    if (nextState === 1) setRipple({ key, id: Date.now() });
    update({ ...data, cells });
  };

  const setMood = (day: number, mood: Mood) => {
    update({ ...data, meta: { ...data.meta, [day]: { ...data.meta[day], mood } } });
  };

  const hoveredHabit = hover ? habits.find(h => h.id === hover.habitId) : null;
  const hoveredDay = hover ? info.days.find(d => d.day === hover.day) : null;
  const hoveredState = hover ? (data.cells[`${hover.habitId}:${hover.day}`] ?? 0) : 0;
  const hoveredMood = hover ? data.meta[hover.day]?.mood : null;

  // Compute Tooltip values
  const tooltipStats = hoveredHabit && hoveredDay
    ? getTooltipInsights(hoveredHabit.id, hoveredDay.day, hoveredState, hoveredMood ?? null, hoveredDay.isWeekend, hoveredHabit.label)
    : null;

  return (
    <div className="glass relative overflow-hidden rounded-2xl border border-border/40">
      <div className="fog" style={{ top: -100, right: -80, width: 320, height: 320 }} />
      <div className="fog" style={{ bottom: -120, left: -80, width: 320, height: 320 }} />

      <div className="relative flex items-center justify-between border-b border-border/40 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Behavioral Matrix</p>
          </div>
          <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight">
            <span className="neon-text">{info.monthName}</span>{" "}
            <span className="text-muted-foreground/70">{info.year}</span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {info.daysInMonth} days · click to cycle <span className="text-emerald-300">done</span> → <span className="text-amber-300">partial</span> → <span className="text-rose-300">missed</span>
          </p>
        </div>
        <div className="hidden gap-3 text-xs text-muted-foreground md:flex">
          <Legend color="bg-emerald-400/80" label="Done" />
          <Legend color="bg-amber-400/80" label="Partial" />
          <Legend color="bg-rose-400/80" label="Missed" />
        </div>
      </div>

      <div className="relative overflow-x-auto scrollbar-thin">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-30 w-[240px] bg-card/95 px-3 py-2 text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur border-b border-border/40">Routine</th>
              {info.weekGroups.map((w) => (
                <th key={w.week} colSpan={w.end - w.start + 1}
                  className="border-l border-b border-border/40 bg-white/[0.02] px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Week {w.week}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-30 bg-card/95 px-3 py-1 text-left text-[10px] uppercase text-muted-foreground backdrop-blur border-b border-border/40">Day</th>
              {info.days.map((d) => (
                <th key={`wd-${d.day}`}
                  className={cn("grid-cell w-9 px-0 py-1 text-center text-[10px] font-medium uppercase border-b border-border/40",
                    d.isWeekend ? "text-primary/70" : "text-muted-foreground/80",
                    d.isToday && "bg-primary/15 text-foreground")}>{d.weekday.charAt(0)}</th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-30 bg-card/95 px-3 py-1 text-left text-[10px] uppercase text-muted-foreground backdrop-blur border-b border-border/40">Date</th>
              {info.days.map((d) => (
                <th key={`dt-${d.day}`}
                  className={cn("grid-cell w-9 px-0 py-1 text-center text-[11px] font-mono font-semibold border-b border-border/40",
                    d.isToday ? "bg-primary text-primary-foreground accent-glow" : "bg-card/50 text-foreground/80")}>{d.day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((h: Habit, idx: number) => (
              <tr key={h.id} className="group">
                <td className={cn("sticky left-0 z-20 border-t border-border/40 px-3 py-1.5 backdrop-blur",
                  idx % 2 === 0 ? "bg-card/95" : "bg-card/80")}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-muted-foreground/80">{h.time}</span>
                    <span className="text-[13px] font-medium leading-tight text-foreground/95">{h.label}</span>
                  </div>
                </td>
                {info.days.map((d) => {
                  const key = `${h.id}:${d.day}`;
                  const state = data.cells[key] ?? 0;
                  
                  // Streak calculation
                  const hasLeftDone = d.day > 1 && (data.cells[`${h.id}:${d.day - 1}`] === 1);
                  const hasRightDone = d.day < info.daysInMonth && (data.cells[`${h.id}:${d.day + 1}`] === 1);

                  // Dynamic heat intensity & glows depending on mode
                  let activeClass = "";
                  if (state === 1) {
                    activeClass = mode === "operator" 
                      ? "bg-emerald-500/18 shadow-[inset_0_0_8px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
                      : mode === "recovery"
                      ? "bg-amber-500/18"
                      : "bg-emerald-500/12";
                  } else if (state === 2) {
                    activeClass = "bg-amber-500/12";
                  } else if (state === 3) {
                    activeClass = "bg-rose-500/12";
                  }

                  return (
                    <td key={key}
                      className={cn("grid-cell relative h-9 w-9 cursor-pointer p-0 text-center transition-all duration-300",
                        d.isWeekend && "bg-primary/[0.025]",
                        d.isToday && "bg-primary/[0.08]",
                        activeClass,
                        "hover:bg-primary/20 hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_55%,transparent)]")}
                      onClick={() => toggle(h.id, d.day)}
                      onMouseEnter={(e) => {
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setHover({ habitId: h.id, day: d.day, x: r.left + r.width/2, y: r.top });
                      }}
                      onMouseLeave={() => setHover(null)}>
                      
                      {/* Streak connector paths overlay */}
                      {state === 1 && hasLeftDone && <div className="streak-connector-left" />}
                      {state === 1 && hasRightDone && <div className="streak-connector-right" />}

                      <div className="relative flex h-full w-full items-center justify-center z-10">
                        <AnimatePresence mode="wait">
                          <CellIcon key={state} state={state} />
                        </AnimatePresence>
                        {ripple?.key === key && (
                          <motion.span key={ripple.id}
                            initial={{ scale: 0, opacity: 0.6 }} animate={{ scale: 3, opacity: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            onAnimationComplete={() => setRipple(null)}
                            className="pointer-events-none absolute inset-0 rounded-full bg-primary/45" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="sticky left-0 z-20 border-t border-border/60 bg-card/95 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">Mood</td>
              {info.days.map((d) => {
                const mood = data.meta[d.day]?.mood ?? null;
                return (
                  <td key={`m-${d.day}`} className="grid-cell h-8 w-9 p-0 border-t border-border/40">
                    <button type="button"
                      onClick={() => {
                        const next: Mood = mood === "great" ? "ok" : mood === "ok" ? "low" : mood === "low" ? null : "great";
                        setMood(d.day, next);
                      }}
                      className="flex h-full w-full items-center justify-center hover:bg-primary/15"
                      aria-label={`Mood for day ${d.day}`}>
                      {mood === "great" && <Smile className="h-3.5 w-3.5 text-emerald-300" />}
                      {mood === "ok" && <Meh className="h-3.5 w-3.5 text-amber-300" />}
                      {mood === "low" && <Moon className="h-3.5 w-3.5 text-indigo-300" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Glassmorphic Hover Intelligence Tooltip */}
      <AnimatePresence>
        {hover && hoveredHabit && hoveredDay && tooltipStats && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            style={{ position: "fixed", left: hover.x, top: hover.y - 12, transform: "translate(-50%, -100%)" }}
            className="pointer-events-none z-50 w-[240px] rounded-xl glass-strong p-3.5 border border-primary/20 ring-soft">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>{hoveredDay.weekdayLong}, Day {hoveredDay.day}</span>
              <span className="flex items-center gap-1 text-primary font-bold"><Sparkles className="h-2.5 w-2.5" /> AI Insight</span>
            </div>
            
            <div className="mt-2 text-[13px] font-semibold text-foreground leading-tight">{hoveredHabit.label}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{hoveredHabit.time}</div>
            
            <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
              <Stat label="Status" value={["empty","done","partial","missed"][hoveredState]} />
              <Stat label="Mood State" value={hoveredMood ? `${hoveredMood} (${tooltipStats.moodDesc})` : "—"} />
              <Stat label="Energy battery" value={tooltipStats.energyDesc} />
              <Stat label="Consistency" value={tooltipStats.prodSummary} />
            </div>

            <div className="mt-3 rounded-lg bg-white/[0.02] border border-border/30 p-2 text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-primary block uppercase tracking-wider text-[8px] mb-0.5">AI Suggestion</span>
              {tooltipStats.aiNote}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.02] border border-border/30 px-2 py-1">
      <div className="text-muted-foreground/70 uppercase tracking-wider text-[8px]">{label}</div>
      <div className="mt-0.5 font-medium text-foreground/90 capitalize leading-snug truncate">{value}</div>
    </div>
  );
}

function getTooltipInsights(hId: string, day: number, state: number, mood: Mood, isWeekend: boolean, habitLabel: string): {
  moodDesc: string;
  energyDesc: string;
  aiNote: string;
  prodSummary: string;
} {
  let moodDesc = "Steady";
  if (mood === "great") moodDesc = "Flow state";
  else if (mood === "ok") moodDesc = "Balanced";
  else if (mood === "low") moodDesc = "Fatigue alert";

  let energyDesc = isWeekend ? "Recharging (45%)" : "Steady (85%)";
  if (state === 1) energyDesc = isWeekend ? "Restored (90%)" : "Peak (95%)";
  else if (state === 3) energyDesc = "Depleted (25%)";

  let aiNote = "Stacking this routine with a morning planning session preserves momentum.";
  if (state === 1) aiNote = `Excellent execution. This ${habitLabel} block is correlated with positive evening focus.`;
  else if (state === 2) aiNote = "Partial completion logged. Willpower friction detected; consider shortening this block.";
  else if (state === 3) aiNote = "Burnout indicator. Shift to Recovery mode if fatigue persists.";

  let prodSummary = "Stable";
  if (state === 1) prodSummary = "Streak active";
  else if (state === 3) prodSummary = "Willpower gap";

  return { moodDesc, energyDesc, aiNote, prodSummary };
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", color)} />
      {label}
    </span>
  );
}
