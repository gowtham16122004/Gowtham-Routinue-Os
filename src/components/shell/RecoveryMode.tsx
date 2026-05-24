import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, Leaf, Wind, Timer, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

import { useOS } from "@/lib/os-store";
import { MountainBackground } from "./recovery/MountainBackground";
import { RecoveryOrb } from "./recovery/RecoveryOrb";
import { AmbientAudioPanel } from "./recovery/AmbientAudioPanel";
import { RecoveryInsights } from "./recovery/RecoveryInsights";
import { RecoveryProgress } from "./recovery/RecoveryProgress";
import { useBreathingEngine, BREATH_PATTERNS } from "./recovery/BreathingEngine";
import { useAmbientAudio, type AmbientSound } from "./recovery/useAmbientAudio";

/* ─── LocalStorage persistence ────────────────────────────────────────────── */
const RECOVERY_SESSION_KEY = "routineos_recovery_session";
const RECOVERY_STREAK_KEY  = "routineos_recovery_streak";

interface PersistedRecoverySession {
  startAt:    number;
  duration:   number;
  status:     "running" | "paused";
  pausedAt:   number;
  patternIdx: number;
}

function safeGet<T>(key: string): T | null {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function safeSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}
function safeRemove(key: string) {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

/* ─── Session timer hook (Drift-free requestAnimationFrame-aligned Clock) ── */
function useRecoverySession() {
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "complete">("idle");
  const [seconds, setSeconds] = useState(0);
  const [duration, setDuration] = useState(20 * 60); // 20 min default

  const startAtRef  = useRef(0);
  const pausedAtRef = useRef(0);
  const durRef      = useRef(duration);
  const statusRef   = useRef<typeof status>("idle");
  const rafRef      = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  useEffect(() => { durRef.current = duration; }, [duration]);

  const stopTicker = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  const startTicker = useCallback(() => {
    stopTicker();
    lastTickRef.current = Date.now();

    const tick = () => {
      if (statusRef.current !== "running") return;
      const now = Date.now();
      const elapsed = (now - startAtRef.current) / 1000;
      const remaining = durRef.current - elapsed;

      if (remaining <= 0) {
        stopTicker();
        setSeconds(0);
        statusRef.current = "complete";
        setStatus("complete");
        safeRemove(RECOVERY_SESSION_KEY);
        
        // Update streak
        const today = new Date().toDateString();
        const streak = safeGet<{ date: string; count: number }>(RECOVERY_STREAK_KEY);
        if (!streak || streak.date !== today) {
          safeSet(RECOVERY_STREAK_KEY, { date: today, count: (streak?.count ?? 0) + 1 });
        }
        return;
      }

      setSeconds(Math.round(remaining));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [stopTicker]);

  useEffect(() => () => stopTicker(), [stopTicker]);

  const start = useCallback((durationMins: number, patternIdx: number) => {
    const secs = durationMins * 60;
    const now = Date.now();
    durRef.current = secs;
    startAtRef.current = now;
    pausedAtRef.current = 0;
    statusRef.current = "running";

    setDuration(secs);
    setSeconds(secs);
    setStatus("running");

    safeSet(RECOVERY_SESSION_KEY, {
      startAt: now, duration: secs, status: "running", pausedAt: 0, patternIdx,
    } satisfies PersistedRecoverySession);

    startTicker();
  }, [startTicker]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    stopTicker();
    pausedAtRef.current = Date.now();
    statusRef.current = "paused";
    setStatus("paused");

    const raw = safeGet<PersistedRecoverySession>(RECOVERY_SESSION_KEY);
    if (raw) safeSet(RECOVERY_SESSION_KEY, { ...raw, status: "paused", pausedAt: pausedAtRef.current });
  }, [stopTicker]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    const diff = Date.now() - pausedAtRef.current;
    startAtRef.current += diff;
    pausedAtRef.current = 0;
    statusRef.current = "running";
    setStatus("running");

    const raw = safeGet<PersistedRecoverySession>(RECOVERY_SESSION_KEY);
    if (raw) safeSet(RECOVERY_SESSION_KEY, { ...raw, status: "running", startAt: startAtRef.current, pausedAt: 0 });

    startTicker();
  }, [startTicker]);

  const end = useCallback((cancel = false) => {
    stopTicker();
    safeRemove(RECOVERY_SESSION_KEY);
    statusRef.current = "idle";
    setStatus("idle");
    setSeconds(0);
    if (!cancel) {
      const today = new Date().toDateString();
      const streak = safeGet<{ date: string; count: number }>(RECOVERY_STREAK_KEY);
      if (!streak || streak.date !== today) {
        safeSet(RECOVERY_STREAK_KEY, { date: today, count: (streak?.count ?? 0) + 1 });
      }
    }
  }, [stopTicker]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = safeGet<PersistedRecoverySession>(RECOVERY_SESSION_KEY);
    if (!saved || !saved.startAt || !saved.duration) return;

    let remaining: number;
    if (saved.status === "paused") {
      remaining = saved.duration - (saved.pausedAt - saved.startAt) / 1000;
    } else {
      remaining = saved.duration - (Date.now() - saved.startAt) / 1000;
    }
    if (remaining <= 0) { safeRemove(RECOVERY_SESSION_KEY); return; }

    durRef.current = saved.duration;
    startAtRef.current = saved.startAt;
    pausedAtRef.current = saved.pausedAt;
    statusRef.current = saved.status;

    setDuration(saved.duration);
    setSeconds(Math.round(remaining));
    setStatus(saved.status);

    if (saved.status === "running") startTicker();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streak = (() => {
    const s = safeGet<{ date: string; count: number }>(RECOVERY_STREAK_KEY);
    return s?.count ?? 0;
  })();

  return { status, seconds, duration, streak, start, pause, resume, end };
}

/* ─── Volumetric Canvas Organic Particle system ───────────────────────────── */
interface ParticlesProps {
  active: boolean;
  breathPhase: string;
  breathProgress: number;
  sessionProgress: number;
}

function RecoveryParticles({ active, breathPhase, breathProgress, sessionProgress }: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const pts = Array.from({ length: 42 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height * 0.75,
      r:     Math.random() * 1.2 + 0.3,
      dx:    (Math.random() - 0.5) * 0.08,
      dy:    (Math.random() - 0.5) * 0.08,
      a:     Math.random() * 0.3 + 0.05,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      t += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const eff = active ? 1 : 0.18;
      
      // Speed reacts directly to breathing phase progress
      let speedMod = 1.0;
      if (breathPhase === "inhale") {
        speedMod = 1.0 + breathProgress * 0.8;
      } else if (breathPhase === "exhale") {
        speedMod = 1.0 - breathProgress * 0.5;
      } else if (breathPhase === "hold") {
        speedMod = 0.4;
      }

      // Calm organic deceleration as recovery session approaches completion
      const calmFactor = Math.max(0.2, 1.0 - sessionProgress * 0.7);

      for (const p of pts) {
        const alpha = p.a * eff * (0.5 + 0.5 * Math.sin(t + p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 215, 255, ${alpha})`;
        ctx.fill();
        
        p.x += p.dx * speedMod * calmFactor * 4;
        p.y += p.dy * speedMod * calmFactor * 2;
        
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height * 0.75) p.dy *= -1;
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active, breathPhase, breathProgress, sessionProgress]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45];

/* ─── Main RecoveryMode orchestrator ─────────────────────────────────────── */
export function RecoveryMode() {
  const { mode, setMode } = useOS();
  const visible = mode === "recovery";

  const [patternIdx,    setPatternIdx]    = useState(0);
  const [durationMins,  setDurationMins]  = useState(20);
  const [showDuration,  setShowDuration]  = useState(false);
  const [showComplete,  setShowComplete]  = useState(false);

  const session = useRecoverySession();
  const [audio, audioControls] = useAmbientAudio();

  const { state: breathState, start: startBreath, stop: stopBreath, reset: resetBreath } =
    useBreathingEngine({ pattern: BREATH_PATTERNS[patternIdx] });

  // Sync session complete trigger
  useEffect(() => {
    if (session.status === "complete") {
      stopBreath();
      setShowComplete(true);
    }
  }, [session.status, stopBreath]);

  const handleStart = useCallback(() => {
    if (session.status === "idle" || session.status === "complete") {
      session.start(durationMins, patternIdx);
      startBreath();
      setShowComplete(false);
    } else if (session.status === "running") {
      session.pause();
      stopBreath();
    } else if (session.status === "paused") {
      session.resume();
      startBreath();
    }
  }, [session, durationMins, patternIdx, startBreath, stopBreath]);

  const handleEnd = useCallback(() => {
    session.end(false);
    resetBreath();
    audioControls.stop();
    setShowComplete(false);
  }, [session, resetBreath, audioControls]);

  const handleReset = useCallback(() => {
    session.end(true);
    resetBreath();
    setShowComplete(false);
  }, [session, resetBreath]);

  const handleExitRecovery = useCallback(() => {
    session.end(true);
    resetBreath();
    audioControls.stop();
    setShowComplete(false);
    setMode("operator");
  }, [session, resetBreath, audioControls, setMode]);

  // Keyboard space-toggle support
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, handleStart]);

  const isRunning  = session.status === "running";
  const isPaused   = session.status === "paused";
  const isComplete = session.status === "complete";
  const isIdle     = session.status === "idle";

  const sessionProgress = session.duration > 0
    ? Math.min(1.0, (session.duration - session.seconds) / session.duration)
    : 0;

  const ctaLabel =
    isRunning  ? "Pause Session"
    : isPaused ? "Resume Session"
    : isComplete ? "Session Complete"
    : "Start Recovery Protocol";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="recovery-mode"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 overflow-hidden flex flex-col justify-between"
          style={{
            zIndex: 45,
            background: "#010206",
            fontFamily: "var(--font-sans)",
          }}
        >
          {/* ── Immersive Parallax Environment ── */}
          <MountainBackground
            ambientTone={audio.current ?? "default"}
            sessionRunning={isRunning}
            breathPhase={breathState.phase}
            breathProgress={breathState.progress}
          />

          {/* ── Volumetric Star Dust particles ── */}
          <RecoveryParticles
            active={isRunning}
            breathPhase={breathState.phase}
            breathProgress={breathState.progress}
            sessionProgress={sessionProgress}
          />

          {/* ════════════════════════════════════════
              HUD TOP META BAR
          ════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="w-full flex items-center justify-between px-8 py-5 relative"
            style={{ zIndex: 10 }}
          >
            {/* Left Protocol Identity */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.04] backdrop-blur-md">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isRunning ? "#64d2ff" : isPaused ? "#ffd60a" : "rgba(255,255,255,0.2)",
                  }}
                />
                <span className="text-[0.55rem] font-bold tracking-[0.24em] text-white/50 uppercase">
                  Routine OS · Recovery Sanctuary
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.01]">
                <Leaf className="w-3 h-3 text-emerald-400/40" />
                <span className="text-[0.50rem] font-semibold tracking-[0.16em] text-white/30 uppercase">
                  Nervous Regulation
                </span>
              </div>
            </div>

            {/* Right workspace toggle actions */}
            <div className="flex items-center gap-3">
              {session.streak > 0 && (
                <div className="px-2.5 py-0.5 rounded-full bg-amber-400/5 border border-amber-400/10">
                  <span className="text-[0.52rem] font-bold text-amber-200/60 uppercase tracking-[0.12em]">
                    🔥 {session.streak} Day streak
                  </span>
                </div>
              )}

              {(isRunning || isPaused) ? (
                <motion.button
                  onClick={handleEnd}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-400/5 hover:bg-red-400/10 border border-red-400/15 cursor-pointer text-red-200/60 hover:text-red-200/80 transition-all text-[0.56rem] font-bold tracking-[0.12em] uppercase"
                >
                  <X className="w-3.5 h-3.5" />
                  Terminate Session
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleExitRecovery}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] cursor-pointer text-white/50 hover:text-white/80 transition-all text-[0.56rem] font-bold tracking-[0.12em] uppercase"
                >
                  <X className="w-3.5 h-3.5" />
                  Exit Sanctuary
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* ════════════════════════════════════════
              MAIN SPATIAL CENTER LAYOUT
          ════════════════════════════════════════ */}
          <div className="flex-1 w-full flex items-stretch px-8 relative" style={{ zIndex: 5 }}>
            {/* ── LEFT margin: Acoustic Selector + Patterns ── */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.9 }}
              className="w-72 shrink-0 flex flex-col justify-between py-6 pr-6 border-r border-white/[0.02]"
            >
              <AmbientAudioPanel audio={audio} controls={audioControls} />

              {/* Breath structural details selector */}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/[0.02]">
                <span className="text-[0.56rem] font-semibold tracking-[0.32em] text-white/30 uppercase block">
                  Respiration Loops
                </span>
                <div className="flex flex-col gap-1.5">
                  {BREATH_PATTERNS.map((p, i) => {
                    const isActive = patternIdx === i;
                    return (
                      <motion.button
                        key={p.name}
                        onClick={() => { if (!isRunning) setPatternIdx(i); }}
                        whileHover={{ x: isRunning ? 0 : 2 }}
                        disabled={isRunning}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                          isActive
                            ? "bg-white/[0.03] border-white/[0.12]"
                            : "bg-transparent border-white/[0.02] hover:border-white/[0.06]"
                        } ${isRunning && !isActive ? "opacity-35 cursor-not-allowed" : "opacity-100"}`}
                      >
                        <div>
                          <span className="text-[0.62rem] font-medium text-white/60 block">{p.name}</span>
                          <span className="text-[0.50rem] text-white/20 block mt-0.5">{p.description}</span>
                        </div>
                        <span className="text-[0.52rem] font-mono text-white/30 pl-2">
                          {p.inhale}s-{p.hold}s-{p.exhale}s
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* ── CENTER focus: Massive Breathing Reactor Core ── */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Soft floating breath loop indicator message */}
              <div className="absolute top-8">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={breathState.running ? breathState.phase : "ready"}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 0.35, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.8 }}
                    className="text-[0.58rem] font-medium tracking-[0.4em] text-white uppercase"
                  >
                    {breathState.running
                      ? breathState.phase === "inhale" ? "Draw Oxygen Inwards"
                        : breathState.phase === "hold"   ? "Hold Breath in Stillness"
                        : "Exhale Tension Outwards"
                      : "Acoustics Prime. Prepare Breath."
                    }
                  </motion.span>
                </AnimatePresence>
              </div>

              <RecoveryOrb
                breathState={breathState}
                sessionRunning={isRunning || isPaused}
                sessionSeconds={session.seconds}
                sessionDuration={session.duration}
                ambientTone={audio.current ?? "default"}
              />

              <div className="absolute bottom-8 flex flex-col items-center">
                <span className="text-[0.52rem] font-semibold tracking-[0.24em] text-white/20 uppercase mb-1">
                  Active Preset
                </span>
                <span className="text-[0.62rem] font-medium text-white/40 tracking-[0.02em] uppercase">
                  {BREATH_PATTERNS[patternIdx].name} ({BREATH_PATTERNS[patternIdx].inhale}s-{BREATH_PATTERNS[patternIdx].hold}s-{BREATH_PATTERNS[patternIdx].exhale}s)
                </span>
              </div>
            </div>

            {/* ── RIGHT margin: Live Telemetry + Metrics details ── */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.9 }}
              className="w-72 shrink-0 flex flex-col justify-between py-6 pl-6 border-l border-white/[0.02]"
            >
              <RecoveryInsights
                sessionSeconds={session.seconds}
                sessionDuration={session.duration}
                sessionRunning={isRunning}
                breathCycles={breathState.cycle}
              />

              {/* Spatial HUD information rows */}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/[0.02]">
                <span className="text-[0.56rem] font-semibold tracking-[0.32em] text-white/30 uppercase block">
                  Configuration Details
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Target Session Time", value: `${durationMins} min` },
                    { label: "Respirations Stacked", value: `${breathState.cycle} cycles` },
                    { label: "System Calibration",  value: BREATH_PATTERNS[patternIdx].name },
                    { label: "Acoustic Aura",       value: audio.current ? audio.current.charAt(0).toUpperCase() + audio.current.slice(1) : "Neutral" },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-baseline">
                      <span className="text-[0.56rem] text-white/25">{row.label}</span>
                      <span className="text-[0.56rem] font-mono text-white/50">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ════════════════════════════════════════
              HUD BOTTOM DECOMPRESSION PANEL
          ════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-full flex flex-col items-center relative py-6 border-t border-white/[0.02]"
            style={{ zIndex: 10 }}
          >
            <div className="w-full max-w-4xl flex items-center justify-between px-8">
              {/* Minimal Capsule progress indicator bars */}
              <div className="flex-1 max-w-xl">
                <RecoveryProgress
                  sessionSeconds={session.seconds}
                  sessionDuration={session.duration}
                  sessionRunning={isRunning}
                  breathCycles={breathState.cycle}
                  streak={session.streak}
                />
              </div>

              {/* Centered execution triggers */}
              <div className="flex flex-col items-end gap-3 pl-8 shrink-0">
                {isIdle && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDuration(s => !s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.04] backdrop-blur-md cursor-pointer text-white/50 hover:text-white/80 transition-colors text-[0.58rem] font-medium"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      {durationMins} Mins duration
                      {showDuration ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <AnimatePresence>
                      {showDuration && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex gap-1 px-1.5 py-1 rounded-full bg-black/90 border border-white/[0.06] backdrop-blur-lg absolute right-12 bottom-20"
                        >
                          {DURATION_OPTIONS.map(d => (
                            <button
                              key={d}
                              onClick={() => { setDurationMins(d); setShowDuration(false); }}
                              className={`px-2 py-0.5 rounded-full cursor-pointer text-[0.52rem] font-mono font-medium ${
                                durationMins === d ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                              }`}
                            >
                              {d}m
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Main CTA */}
                <motion.button
                  onClick={isComplete ? handleReset : handleStart}
                  whileHover={!isComplete ? { scale: 1.01 } : {}}
                  whileTap={!isComplete ? { scale: 0.99 } : {}}
                  className={`w-52 py-3.5 px-6 rounded-xl border text-center font-semibold text-[0.68rem] tracking-[0.06em] uppercase cursor-pointer select-none transition-all duration-300 ${
                    isComplete
                      ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : isRunning
                      ? "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-white/70"
                      : "bg-white/90 hover:bg-white border-transparent text-black"
                  }`}
                  style={{
                    boxShadow: isRunning || isPaused ? "none" : "0 4px 20px rgba(255,255,255,0.08)",
                  }}
                >
                  {isComplete ? "✓ Cycle Completed" : ctaLabel}
                </motion.button>

                {/* Cancel link */}
                {(isRunning || isPaused) && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 bg-transparent border-none text-[0.52rem] font-semibold text-white/25 hover:text-white/40 tracking-[0.08em] uppercase cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Void Session
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Complete Overlay Screen ── */}
          <AnimatePresence>
            {showComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-3xl"
                style={{ zIndex: 30 }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-md w-full px-12 py-10 rounded-2xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-md text-center"
                >
                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="text-[2rem] text-white/60 mb-3"
                  >
                    ✦
                  </motion.div>
                  <h2 className="text-[1.1rem] font-semibold text-white/80 tracking-[0.02em] mb-2">
                    Decompression Completed
                  </h2>
                  <p className="text-[0.62rem] leading-relaxed text-white/35 max-w-[18rem] mx-auto mb-8">
                    You have spent {durationMins} minutes in deep autonomic calibration. Your cognitive stability has been successfully restored.
                  </p>
                  
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setShowComplete(false)}
                      className="px-4 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] cursor-pointer text-white/50 hover:text-white/70 transition-colors text-[0.58rem] font-bold uppercase tracking-[0.06em]"
                    >
                      Return to Sanctuary
                    </button>
                    <button
                      onClick={handleExitRecovery}
                      className="px-4 py-2.5 rounded-xl border border-transparent bg-white hover:bg-white/90 cursor-pointer text-black transition-colors text-[0.58rem] font-bold uppercase tracking-[0.06em]"
                    >
                      Exit to Workspace
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
