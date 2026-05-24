import { motion, AnimatePresence } from "framer-motion";
import { Brain, Flame, Sparkles, Timer, Zap, AlertTriangle, BookOpen, Pause, Play, RotateCcw, X, BatteryCharging, ShieldAlert, Heart, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOS, type SessionType } from "@/lib/os-store";
import { getMonthInfo } from "@/lib/habits";
import { cn } from "@/lib/utils";

export function ContextPanel() {
  const {
    data,
    habits,
    rightPanel,
    setRightPanel,
    focusMode,
    mode,
    setMode,
    activeSession,
    sessionStatus,
    sessionSeconds,
    sessionDuration,
    sessionNotes,
    setSessionNotes,
    startSession,
    pauseSession,
    resumeSession,
    endSession
  } = useOS();

  const today = new Date().getDate();
  const info = useMemo(() => getMonthInfo(), []);

  // AI Memory list (simulated dynamic memory highlights)
  const memoryLogs = useMemo(() => {
    let doneCount = 0;
    for (const h of habits) {
      if (data.cells[`${h.id}:${today}`] === 1) doneCount++;
    }

    const logs = [
      { id: 1, text: "AI Learning block completed at 8:40 AM." },
      { id: 2, text: "Streak connector active for Project Work." },
    ];
    if (doneCount >= 3) {
      logs.unshift({ id: 3, text: "Apex focus alignment achieved early afternoon." });
    }
    if (mode === "recovery") {
      logs.unshift({ id: 4, text: "Recovery protocols initiated. Cognitive Load decreased." });
    }
    return logs;
  }, [data, habits, today, mode]);

  // Compute metrics with premium names
  const metrics = useMemo(() => {
    let completedAll = 0;
    let todayDone = 0;
    let totalPossible = habits.length * today;

    for (const h of habits) {
      for (let d = 1; d <= today; d++) {
        if (data.cells[`${h.id}:${d}`] === 1) {
          completedAll++;
          if (d === today) todayDone++;
        }
      }
    }

    const velocity = Math.min(100, Math.round((completedAll / Math.max(1, totalPossible)) * 100));
    const integrity = Math.round((todayDone / habits.length) * 100);

    // Neural Load: increases with running session time & completed habits
    let neuralLoad = 15; // baseline
    if (activeSession) neuralLoad += 45;
    if (sessionStatus === "running") neuralLoad += 15;
    neuralLoad += todayDone * 5;

    // Burnout risk: higher if velocity is low but neural load is high
    const burnout = Math.max(8, Math.min(95, Math.round((neuralLoad * 1.2) - (velocity * 0.4))));

    // Recovery State: inverse of burnout risk, higher if sleep/fitness habits done
    const isWorkoutDone = data.cells[`workout:${today}`] === 1;
    const isSleepDone = data.cells[`sleep:${today}`] === 1;
    let recoveryState = 100 - burnout;
    if (isWorkoutDone) recoveryState += 10;
    if (isSleepDone) recoveryState += 15;
    recoveryState = Math.min(100, Math.max(10, recoveryState));

    return { velocity, integrity, neuralLoad, burnout, recoveryState, todayDone };
  }, [data, habits, today, activeSession, sessionStatus]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const progress = ((sessionDuration - sessionSeconds) / sessionDuration) * 100;

  // Selected launcher duration
  const [launcherDuration, setLauncherDuration] = useState(25);

  return (
    <AnimatePresence>
      {rightPanel && !focusMode && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="hidden xl:block w-[320px] shrink-0"
        >
          <div className="sticky top-4 mr-3 mt-3 h-[calc(100vh-1.5rem)] overflow-y-auto scrollbar-thin rounded-2xl glass-strong ring-soft p-4 space-y-4 border border-border/40">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  AI Mission Control
                </span>
              </div>
              <button
                onClick={() => setRightPanel(false)}
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.05]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Mode Indicator & Swappable Dashboard */}
            {mode !== "recovery" ? (
              /* OPERATOR DASHBOARD */
              <div className="space-y-4">
                {/* Momentum Velocity */}
                <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3.5 ring-soft relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] uppercase font-bold tracking-wider text-muted-foreground/80">
                      Momentum Velocity
                    </span>
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-bold tracking-tight">{metrics.velocity}</span>
                    <span className="text-[11px] text-muted-foreground">index</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.velocity}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/45"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Aligning: {metrics.todayDone}/{habits.length} habits</span>
                    <span className="text-emerald-400 font-medium">Optimal flow</span>
                  </div>
                </div>

                {/* Neural Load / Cognitive Stability */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3 ring-soft text-left">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70 flex items-center gap-1">
                      <Brain className="h-3 w-3 text-primary" /> Neural Load
                    </div>
                    <div className="mt-1.5 font-display text-xl font-bold text-foreground">
                      {metrics.neuralLoad}%
                    </div>
                    <div className="mt-1 text-[9.5px] text-muted-foreground">
                      {metrics.neuralLoad > 50 ? "Peak focus load" : "Stable baseline"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3 ring-soft text-left">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70 flex items-center gap-1">
                      <BatteryCharging className="h-3 w-3 text-emerald-400" /> Focus Integrity
                    </div>
                    <div className="mt-1.5 font-display text-xl font-bold text-foreground">
                      {metrics.integrity}%
                    </div>
                    <div className="mt-1 text-[9.5px] text-muted-foreground">
                      Today's progress
                    </div>
                  </div>
                </div>

                {/* AI Coaching Tips */}
                <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3.5 ring-soft">
                  <div className="flex items-center gap-1.5 text-[10.5px] uppercase font-bold tracking-wider text-muted-foreground/80">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Active Coach
                  </div>
                  <ul className="mt-2.5 space-y-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                    <li className="flex items-start gap-2 bg-white/[0.01] p-2 rounded-lg border border-border/30">
                      <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
                      <span>Best window detected · 7–10 AM. Stack hardest routine here.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-white/[0.01] p-2 rounded-lg border border-border/30">
                      <span className="h-1.5 w-1.5 mt-2 rounded-full bg-primary shrink-0" />
                      <span>Workout days improve coding focus consistency by 18%.</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              /* RECOVERY DASHBOARD */
              <div className="space-y-4">
                {/* Burnout Probability */}
                <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3.5 ring-soft relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] uppercase font-bold tracking-wider text-muted-foreground/80">
                      Burnout Probability
                    </span>
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-bold tracking-tight text-amber-400">{metrics.burnout}%</span>
                    <span className="text-[11px] text-muted-foreground">risk level</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.burnout}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500/30"
                    />
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    Recommendation: Mute high-stress cognitive loads.
                  </div>
                </div>

                {/* Restoration stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3 ring-soft text-left">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70 flex items-center gap-1">
                      <Heart className="h-3 w-3 text-rose-400" /> Energy Restore
                    </div>
                    <div className="mt-1.5 font-display text-xl font-bold text-foreground">
                      {metrics.recoveryState}%
                    </div>
                    <div className="mt-1 text-[9.5px] text-muted-foreground">
                      Circadian Battery
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3 ring-soft text-left">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 text-primary animate-spin" /> Sleep Index
                    </div>
                    <div className="mt-1.5 font-display text-xl font-bold text-foreground">
                      7.8h
                    </div>
                    <div className="mt-1 text-[9.5px] text-muted-foreground">
                      Average rest duration
                    </div>
                  </div>
                </div>

                {/* Wellness insights */}
                <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3.5 ring-soft">
                  <div className="flex items-center gap-1.5 text-[10.5px] uppercase font-bold tracking-wider text-muted-foreground/80">
                    <Heart className="h-3.5 w-3.5 text-amber-300" /> Burnout Insights
                  </div>
                  <ul className="mt-2.5 space-y-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                    <li className="flex items-start gap-2 bg-white/[0.01] p-2 rounded-lg border border-border/30">
                      <span className="h-1.5 w-1.5 mt-2 rounded-full bg-amber-400 shrink-0" />
                      <span>Focus efficiency dropped 18% after 8 PM. Shift to rest mode.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-white/[0.01] p-2 rounded-lg border border-border/30">
                      <span className="h-1.5 w-1.5 mt-2 rounded-full bg-amber-400 shrink-0" />
                      <span>Sleep efficiency high. Cognitive load stable for tomorrow.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Interactive Session Tracker/Launcher */}
            <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3.5 ring-soft">
              {activeSession ? (
                /* Session Running UI */
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 text-primary" /> Active Session
                    </span>
                    <span className="capitalize">{activeSession.replace("-", " ")}</span>
                  </div>

                  <div className="mt-3 font-display text-3xl font-bold tabular-nums tracking-tight">
                    {fmt(sessionSeconds)}
                  </div>
                  
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (sessionStatus === "running") pauseSession();
                        else resumeSession();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary/15 ring-1 ring-primary/45 py-2 text-xs font-semibold hover:bg-primary/25 transition-all text-foreground"
                    >
                      {sessionStatus === "running" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      <span>{sessionStatus === "running" ? "Pause" : "Resume"}</span>
                    </button>
                    
                    <button
                      onClick={() => endSession(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.02] border border-border/60 py-2 text-xs font-semibold hover:bg-white/[0.08] transition-all text-foreground"
                    >
                      <X className="h-3 w-3" />
                      <span>Finish</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Session Launcher Options */
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Focus Session Launcher
                    </span>
                    <select
                      value={launcherDuration}
                      onChange={(e) => setLauncherDuration(parseInt(e.target.value, 10))}
                      className="bg-transparent text-[10px] font-semibold text-muted-foreground outline-none cursor-pointer hover:text-foreground"
                    >
                      <option value={15}>15 min</option>
                      <option value={25}>25 min</option>
                      <option value={50}>50 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>

                  <div className="mt-3.5 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => startSession("deep-work", launcherDuration)}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.015] border border-border/40 text-center hover:bg-primary/10 hover:border-primary/40 transition-all text-foreground group"
                    >
                      <Timer className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="mt-1 text-[11px] font-medium leading-none">Deep Work</span>
                    </button>

                    <button
                      onClick={() => startSession("learning", launcherDuration)}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.015] border border-border/40 text-center hover:bg-primary/10 hover:border-primary/40 transition-all text-foreground group"
                    >
                      <Brain className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="mt-1 text-[11px] font-medium leading-none">AI Learning</span>
                    </button>

                    <button
                      onClick={() => startSession("workout", launcherDuration)}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.015] border border-border/40 text-center hover:bg-primary/10 hover:border-primary/40 transition-all text-foreground group"
                    >
                      <Zap className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="mt-1 text-[11px] font-medium leading-none">Workout</span>
                    </button>

                    <button
                      onClick={() => startSession("reflection", launcherDuration)}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.015] border border-border/40 text-center hover:bg-primary/10 hover:border-primary/40 transition-all text-foreground group"
                    >
                      <BookOpen className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="mt-1 text-[11px] font-medium leading-none">Reflection</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Memory Logs */}
            <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3.5 ring-soft">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                <Trophy className="h-3.5 w-3.5 text-primary" /> AI Behavioral Memory
              </div>
              <div className="mt-2.5 space-y-2 max-h-[120px] overflow-y-auto pr-1">
                {memoryLogs.map((log) => (
                  <div key={log.id} className="text-[11px] font-mono leading-relaxed bg-white/[0.01] border border-border/20 px-2 py-1.5 rounded-lg text-muted-foreground flex gap-1.5 items-start">
                    <span className="text-primary font-bold">›</span>
                    <span>{log.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Notes Widget */}
            <div className="rounded-xl bg-white/[0.02] border border-border/40 p-3.5 ring-soft">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Quick Notes
              </div>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Capture rapid thoughts, workflow obstacles, or breakthroughs here..."
                rows={3}
                className="mt-2 w-full resize-none rounded-lg bg-white/[0.01] border border-border/30 px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary/50 placeholder:text-muted-foreground/30 font-sans"
              />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
