import { AnimatePresence, motion } from "framer-motion";
import {
  Brain, Check, Clock, Mic, Pause, Play, Plus, Shield,
  Smile, Volume2, VolumeX, X, Zap, Activity,
  Wind, Radio, Droplets, Star, TrendingUp, SkipForward, Waves, Target, Flame,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useOS } from "@/lib/os-store";
import { SessionRitual } from "@/components/shell/SessionRitual";
import { getAdaptiveAIMessage, type TimeOfDay } from "@/lib/ai-core";
import type { SessionType } from "@/lib/os-store";

/* ─── helpers ─────────────────────────────────── */
const fmt = (s: number) => {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

function getTimeOfDayNow(): TimeOfDay {
  const h = new Date().getHours();
  if (h < 5)  return "night";
  if (h < 9)  return "early-morning";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

/* ─── AI companion messages ─────────────────────── */
const AI_IDLE      = ["Initialising cognitive environment…", "Deep focus chamber activating.", "Neural pathways priming…", "Calibrating focus architecture."];
const AI_FLOW      = ["You're in a deep flow state. Keep going.", "Focus stability increasing.", "Distraction probability low.", "Peak cognitive window active.", "Momentum chain intact.", "Cognitive load balanced.", "Mental clarity optimal.", "Neural coherence high.", "Flow depth: exceptional.", "Momentum rising steadily."];
const AI_DISTRACTED = ["Focus interrupted briefly.", "Re-entering concentration window…", "Momentum recovering.", "Refocusing cognitive resources.", "Distraction cleared. Depth restoring."];
const AI_PAUSED    = ["Session paused.", "Momentum temporarily suspended.", "Take a breath. Ready when you are.", "Focus chamber on standby.", "Cognitive state preserved.", "Pause acknowledged. Flow state cached."];

/* ─── live session states ─────────────────────── */
const SESSION_STATES = [
  { label: "Entering Flow",           threshold: 0,    colour: "rgba(140,160,255,0.85)" },
  { label: "Deep Focus Active",        threshold: 300,  colour: "rgba(100,200,255,0.90)" },
  { label: "Cognitive Stability High", threshold: 900,  colour: "rgba(100,240,180,0.90)" },
  { label: "Momentum Rising",          threshold: 1800, colour: "rgba(140,220,140,0.90)" },
  { label: "Peak Performance",         threshold: 3000, colour: "rgba(240,200,100,0.90)" },
];
function getLiveState(elapsed: number) {
  let state = SESSION_STATES[0];
  for (const s of SESSION_STATES) { if (elapsed >= s.threshold) state = s; }
  return state;
}

/* ─── sound presets ────────────────────────────── */
const SOUND_PRESETS = [
  { label: "Neural Atmosphere", icon: Radio,    colour: "#7c6fe0", desc: "40Hz gamma waves"   },
  { label: "Rain",              icon: Droplets, colour: "#60a8e0", desc: "Gentle rainfall"     },
  { label: "Brown Noise",       icon: Waves,    colour: "#a87c50", desc: "Deep frequency noise"},
  { label: "Deep Space",        icon: Star,     colour: "#4060c0", desc: "Cosmic ambience"     },
  { label: "Focus Frequencies", icon: Activity, colour: "#40c0a0", desc: "14Hz alpha-theta"   },
];

/* ─── focus metrics ────────────────────────────── */
function computeMetrics(elapsed: number, distractions: number) {
  const mins = elapsed / 60;
  const focusState =
    mins > 50 ? "Peak" : mins > 25 ? "Flowing" : mins > 10 ? "Building" : "Initialising";
  const cognitiveLoad =
    distractions > 4 ? "Critical" : distractions > 2 ? "High" : mins > 60 ? "High" : "Optimal";
  const distractionResist =
    distractions === 0 ? "Extreme" : distractions < 2 ? "High" : distractions < 4 ? "Medium" : "Low";
  const mentalEnergy      = Math.max(20, Math.min(100, 85 - distractions * 5 + Math.min(mins, 30)));
  const momentumStability = Math.max(10, Math.min(100, 60 + Math.min(mins * 1.5, 40) - distractions * 8));
  return { focusState, cognitiveLoad, distractionResist, mentalEnergy: Math.round(mentalEnergy), momentumStability: Math.round(momentumStability) };
}

/* ─── mountain SVG background ─────────────────── */
function MountainBackground({ status }: { status: string }) {
  const isRunning = status === "running";
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Deep space gradient */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(20,35,90,0.55) 0%, transparent 70%)",
      }} />

      {/* Moonlight glow — top */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 300, height: 300,
          top: -80, left: "50%", transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(180,210,255,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Mountain SVG — absolutely positioned at the bottom */}
      <svg
        viewBox="0 0 1440 360"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 left-0 w-full"
        style={{ height: "55%", opacity: isRunning ? 1 : 0.7, transition: "opacity 2s ease" }}
      >
        {/* Stars scattered in sky area */}
        {Array.from({ length: 28 }, (_, i) => (
          <circle
            key={i}
            cx={(i * 53 + 17) % 1440}
            cy={(i * 37 + 20) % 160}
            r={Math.random() < 0.5 ? 0.8 : 1.2}
            fill="rgba(200,220,255,0.35)"
          />
        ))}

        {/* Layer 1 — farthest, mist-veiled peaks */}
        <path
          d="M0,360 L0,220 C60,210 100,240 160,205 C220,170 270,235 350,195 C430,158 475,215 560,178 C645,142 690,205 770,168 C850,132 895,195 975,158 C1055,122 1105,185 1190,148 C1270,112 1315,172 1380,140 L1440,128 L1440,360 Z"
          fill="rgba(18,30,85,0.35)"
        />

        {/* Atmospheric fog over far mountains */}
        <rect x="0" y="0" width="1440" height="360"
          fill="url(#fogGrad)" />
        <defs>
          <linearGradient id="fogGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(6,9,24,0)"   />
            <stop offset="38%"  stopColor="rgba(6,9,24,0.15)" />
            <stop offset="55%"  stopColor="rgba(6,9,24,0)"   />
            <stop offset="100%" stopColor="rgba(6,9,24,0)"   />
          </linearGradient>
          <linearGradient id="glowLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(60,100,200,0)"   />
            <stop offset="30%"  stopColor="rgba(60,130,220,0.08)" />
            <stop offset="70%"  stopColor="rgba(80,150,255,0.06)" />
            <stop offset="100%" stopColor="rgba(60,100,200,0)"   />
          </linearGradient>
        </defs>

        {/* Layer 2 — mid mountains, ridge glow */}
        <path
          d="M0,360 L0,265 C80,248 140,282 220,255 C300,228 355,272 450,238 C545,204 590,260 685,222 C780,184 835,250 930,212 C1025,174 1080,242 1175,205 C1270,168 1325,238 1400,208 L1440,196 L1440,360 Z"
          fill="rgba(12,20,65,0.55)"
        />
        {/* Ridge glow on mid mountains */}
        <path
          d="M0,265 C80,248 140,282 220,255 C300,228 355,272 450,238 C545,204 590,260 685,222 C780,184 835,250 930,212 C1025,174 1080,242 1175,205 C1270,168 1325,238 1400,208 L1440,196"
          fill="none"
          stroke="url(#glowLine)"
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Atmospheric mist band */}
        <ellipse cx="720" cy="285" rx="500" ry="22"
          fill="rgba(40,70,160,0.06)"
          filter="blur(8px)" />

        {/* Layer 3 — nearest mountains, darkest */}
        <path
          d="M0,360 L0,305 C100,285 165,318 260,292 C355,266 415,308 515,278 C615,248 675,298 770,265 C865,232 930,285 1025,252 C1120,218 1185,278 1280,248 C1350,225 1400,262 1440,248 L1440,360 Z"
          fill="rgba(6,9,22,0.78)"
        />
        {/* Faint edge glow on near mountains */}
        <path
          d="M0,305 C100,285 165,318 260,292 C355,266 415,308 515,278 C615,248 675,298 770,265 C865,232 930,285 1025,252 C1120,218 1185,278 1280,248 C1350,225 1400,262 1440,248"
          fill="none"
          stroke="rgba(60,100,200,0.10)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Ambient mist over mountains */}
      <motion.div
        className="absolute"
        style={{
          bottom: "8%", left: 0, right: 0, height: "22%",
          background: "linear-gradient(0deg, rgba(8,14,45,0.5) 0%, rgba(15,28,80,0.12) 50%, transparent 100%)",
          filter: "blur(16px)",
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ─── particle canvas ─────────────────────────── */
function ParticleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.75, // keep in upper 75%
      r: Math.random() * 1.2 + 0.2,
      dx: (Math.random() - 0.5) * 0.10,
      dy: (Math.random() - 0.5) * 0.10,
      a: Math.random() * 0.38 + 0.05,
      phase: Math.random() * Math.PI * 2,
    }));

    const stars = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.55,
      r: Math.random() * 0.7 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const eff = active ? 1 : 0.25;

      for (const p of pts) {
        const a = p.a * eff * (0.65 + 0.35 * Math.sin(t + p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,135,255,${a})`;
        ctx.fill();
        p.x += p.dx * eff;
        p.y += p.dy * eff;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height * 0.75) p.dy *= -1;
      }

      for (const s of stars) {
        const a = (0.2 + 0.25 * Math.sin(t * 0.6 + s.phase)) * eff;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,225,255,${a})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1, opacity: active ? 1 : 0.35, transition: "opacity 2s ease" }}
    />
  );
}

/* ─── ambient fog blobs ───────────────────────── */
function AmbientFog({ status }: { status: string }) {
  const running = status === "running";
  const paused  = status === "paused";
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Central breathing glow */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 800, height: 800, top: "42%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(45,70,210,0.12) 0%, transparent 65%)", filter: "blur(80px)" }}
        animate={running ? { scale: [1, 1.14, 1], opacity: [0.45, 0.90, 0.45] } : paused ? { scale: [1, 1.04, 1], opacity: [0.22, 0.40, 0.22] } : { scale: 1, opacity: 0.30 }}
        transition={{ duration: running ? 7 : 12, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Top atmospheric haze */}
      <motion.div
        className="absolute"
        style={{ top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg, rgba(25,45,170,0.09) 0%, transparent 100%)", filter: "blur(30px)" }}
        animate={{ opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Horizontal light streaks */}
      <motion.div className="absolute" style={{ top: "20%", left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(70,115,255,0.13) 35%, rgba(90,155,255,0.09) 65%, transparent 100%)", filter: "blur(2px)" }}
        animate={{ opacity: [0.3, 0.75, 0.3] }} transition={{ duration: 11, repeat: Infinity }} />
      <motion.div className="absolute" style={{ top: "68%", left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(50,95,200,0.07) 30%, rgba(70,135,255,0.05) 70%, transparent 100%)", filter: "blur(1px)" }}
        animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 16, repeat: Infinity, delay: 4 }} />
      {/* Side fog blobs */}
      <motion.div className="absolute rounded-full" style={{ width: 480, height: 480, top: "5%", left: "12%", background: "radial-gradient(circle, rgba(35,62,195,0.06) 0%, transparent 70%)", filter: "blur(65px)" }}
        animate={{ scale: [1, 0.87, 1], opacity: [0.35, 0.65, 0.35], x: [0, 18, 0] }} transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
      <motion.div className="absolute rounded-full" style={{ width: 380, height: 380, bottom: "22%", right: "12%", background: "radial-gradient(circle, rgba(65,42,195,0.05) 0%, transparent 70%)", filter: "blur(55px)" }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.50, 0.25], x: [0, -12, 0] }} transition={{ duration: 23, repeat: Infinity, ease: "easeInOut", delay: 6 }} />
    </div>
  );
}

/* ─── Focus Reactor ───────────────────────────── */
function FocusReactor({ seconds, duration, status, sessionType }: {
  seconds: number; duration: number; status: string; sessionType: string;
}) {
  const progress  = status === "idle" ? 0 : (duration > 0 ? (duration - seconds) / duration : 0);
  const size      = 298;
  const c         = size / 2;
  const r1 = 126, r2 = 108, r3 = 90;
  const circ1 = 2 * Math.PI * r1;
  const circ3 = 2 * Math.PI * r3;
  const running   = status === "running";
  const paused    = status === "paused";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(75,108,255,0.28) 0%, transparent 68%)", filter: "blur(28px)" }}
        animate={running ? { scale: [1, 1.13, 1], opacity: [0.25, 0.58, 0.25] } : paused ? { scale: [1, 1.04, 1], opacity: [0.12, 0.25, 0.12] } : { scale: 1, opacity: 0.15 }}
        transition={{ duration: running ? 5 : 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Extended glow halo */}
      <motion.div
        className="absolute rounded-full"
        style={{ inset: -28, background: "radial-gradient(circle, rgba(55,95,255,0.14) 0%, transparent 60%)", filter: "blur(45px)" }}
        animate={running ? { scale: [1, 1.22, 1], opacity: [0.06, 0.16, 0.06] } : { opacity: 0.04 }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <linearGradient id="rg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#2a48c8" stopOpacity="0.7" />
            <stop offset="50%"  stopColor="#5585f0" stopOpacity="1.0" />
            <stop offset="100%" stopColor="#88beff" stopOpacity="0.85" />
          </linearGradient>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Outer ambient track */}
        <circle cx={c} cy={c} r={r1+9} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={1} />

        {/* Outer track */}
        <circle cx={c} cy={c} r={r1} fill="none" stroke="rgba(90,120,255,0.07)" strokeWidth={4.5} />
        {/* Outer progress */}
        <motion.circle
          cx={c} cy={c} r={r1} fill="none"
          stroke="url(#rg1)" strokeWidth={4.5} strokeLinecap="round"
          strokeDasharray={circ1} strokeDashoffset={circ1 * (1 - progress)}
          transform={`rotate(-90 ${c} ${c})`} filter="url(#ringGlow)"
          animate={running ? { opacity: [0.82, 1, 0.82] } : { opacity: 0.55 }}
          transition={{ duration: 3.5, repeat: Infinity }}
        />

        {/* Mid orbit ring — clockwise */}
        <motion.circle cx={c} cy={c} r={r2} fill="none" stroke="rgba(70,100,220,0.09)" strokeWidth={1.5} strokeDasharray="3 10"
          animate={{ rotate: 360 }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${c}px ${c}px` }} />

        {/* Inner orbit ring — counter */}
        <motion.circle cx={c} cy={c} r={r3} fill="none" stroke="rgba(50,80,200,0.07)" strokeWidth={1} strokeDasharray="2 14"
          animate={{ rotate: -360 }} transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${c}px ${c}px` }} />
        {/* Inner progress */}
        <motion.circle
          cx={c} cy={c} r={r3} fill="none"
          stroke="rgba(90,150,255,0.22)" strokeWidth={2} strokeLinecap="round"
          strokeDasharray={circ3} strokeDashoffset={circ3 * (1 - progress * 0.65)}
          transform={`rotate(-90 ${c} ${c})`}
          animate={running ? { opacity: [0.45, 0.85, 0.45] } : { opacity: 0.30 }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        {/* Progress dot */}
        {progress > 0.005 && (
          <motion.circle
            cx={c + r1 * Math.cos(-Math.PI / 2 + 2 * Math.PI * progress)}
            cy={c + r1 * Math.sin(-Math.PI / 2 + 2 * Math.PI * progress)}
            r={5.5} fill="white" opacity={0.95} filter="url(#ringGlow)"
            animate={running ? { r: [5.5, 7, 5.5], opacity: [0.9, 1, 0.9] } : { r: 5.5, opacity: 0.6 }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
        )}
        {/* Inner dot */}
        {progress > 0.01 && (
          <circle
            cx={c + r3 * Math.cos(-Math.PI / 2 + 2 * Math.PI * progress * 0.65)}
            cy={c + r3 * Math.sin(-Math.PI / 2 + 2 * Math.PI * progress * 0.65)}
            r={3} fill="rgba(110,170,255,0.55)"
          />
        )}
      </svg>

      {/* Center text */}
      <div className="relative flex flex-col items-center justify-center text-center" style={{ zIndex: 2 }}>
        <motion.span
          className="text-[9px] font-bold uppercase tracking-[0.34em] mb-2.5"
          style={{ color: "rgba(125,165,255,0.65)" }}
          animate={paused ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
          transition={{ duration: 1.5, repeat: paused ? Infinity : 0 }}
        >
          {paused ? "PAUSED" : running ? "FOCUSING" : "READY"}
        </motion.span>

        <motion.div
          className="font-mono font-bold tabular-nums leading-none select-none"
          style={{
            fontSize: (status === "idle" ? duration : seconds) >= 3600 ? "2.75rem" : "3.35rem",
            background: paused ? "linear-gradient(135deg, #b5c8ff, #5868a8)" : "linear-gradient(135deg, #dce8ff, #8ca5e5)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}
          animate={
            running ? { filter: ["drop-shadow(0 0 16px rgba(90,135,255,0.32))", "drop-shadow(0 0 30px rgba(90,135,255,0.60))", "drop-shadow(0 0 16px rgba(90,135,255,0.32))"] }
            : paused ? { opacity: [1, 0.52, 1] }
            : {}
          }
          transition={{ duration: 4, repeat: Infinity }}
        >
          {fmt(status === "idle" ? duration : seconds)}
        </motion.div>

        <div className="mt-1.5 text-[10px]" style={{ color: "rgba(135,158,228,0.42)" }}>
          of {fmt(duration)}
        </div>

        <motion.div
          className="mt-3 px-3 py-1 rounded-full text-[9px] font-semibold tracking-widest uppercase"
          style={{ background: "rgba(55,80,195,0.14)", border: "1px solid rgba(95,135,255,0.18)", color: "rgba(155,185,255,0.75)" }}
          animate={running ? { borderColor: ["rgba(95,135,255,0.18)", "rgba(95,135,255,0.40)", "rgba(95,135,255,0.18)"] } : {}}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {sessionType.replace(/-/g, " ")} Session
        </motion.div>
      </div>
    </div>
  );
}

/* ─── sub-components ──────────────────────────── */
function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{
      background: "rgba(7,10,26,0.76)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
      border: "1px solid rgba(95,120,255,0.10)", boxShadow: "0 0 0 1px rgba(255,255,255,0.025) inset, 0 22px 65px rgba(0,0,0,0.58)",
    }}>{children}</div>
  );
}
function MetricRow({ label, value, colour: color }: { label: string; value: string; colour: string }) {
  return (
    <div className="flex items-center justify-between text-[11px] py-1.5">
      <span style={{ color: "rgba(165,180,218,0.50)" }}>{label}</span>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}
function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] mb-1.5">
        <span style={{ color: "rgba(165,180,218,0.50)" }}>{label}</span>
        <span className="font-mono font-semibold" style={{ color: "rgba(125,160,255,0.90)" }}>{value}%</span>
      </div>
      <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #334fc0, #72a8ff)" }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}
function Btn({ children, onClick, style = {}, className = "" }: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; className?: string;
}) {
  return (
    <motion.button onClick={onClick} whileHover={{ scale: 1.07, y: -2 }} whileTap={{ scale: 0.92, y: 0 }}
      transition={{ type: "spring", stiffness: 440, damping: 22 }} className={className} style={style}>
      {children}
    </motion.button>
  );
}

/* ─── Web Audio ambient engine ────────────────── */
function useAmbientAudio() {
  const ctxRef    = useRef<AudioContext | null>(null);
  const gainRef   = useRef<GainNode | null>(null);
  const srcRef    = useRef<AudioBufferSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const [active,  setActive]  = useState(false);
  const [preset,  setPreset]  = useState(-1);
  const [volume,  setVolumeState] = useState(0.28);
  const volRef    = useRef(0.28);
  useEffect(() => { volRef.current = volume; }, [volume]);

  // Build noise buffer — 10 seconds, stereo, smooth loop
  const makeNoise = useCallback((ctx: AudioContext, type: number) => {
    const sr  = ctx.sampleRate;
    const len = sr * 10;
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
      for (let i = 0; i < len; i++) {
        const w = (Math.random() * 2 - 1);
        switch (type) {
          case 0: // Neural — pink noise
            b0 = 0.99886 * b0 + w * 0.0555; b1 = 0.99332 * b1 + w * 0.0751;
            b2 = 0.96900 * b2 + w * 0.1539; b3 = 0.86650 * b3 + w * 0.3105;
            b4 = 0.55000 * b4 + w * 0.5330; b5 = -0.7616  * b5 - w * 0.0169;
            d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + w * 0.5362) * 0.13; break;
          case 1: // Rain — bright white
            d[i] = w * 0.30; break;
          case 2: // Brown noise
            b0 = (b0 + 0.02 * w) / 1.02; d[i] = b0 * 3.0; break;
          case 3: // Deep Space — sub-bass pink
            b0 = 0.99986 * b0 + w * 0.005; b1 = 0.99200 * b1 + w * 0.082; b2 = 0.90000 * b2 + w * 0.282;
            d[i] = (b0 + b1 + b2) * 0.125; break;
          default: // Focus Frequencies — mid-band
            b0 = 0.99200 * b0 + w * 0.10; b1 = 0.86650 * b1 + w * 0.28;
            d[i] = (b0 + b1 + w * 0.10) * 0.17; break;
        }
      }
      // Crossfade edges to eliminate loop clicks
      const fade = Math.min(4096, Math.floor(len * 0.018));
      for (let i = 0; i < fade; i++) {
        d[i]         *= i / fade;
        d[len-1-i]   *= i / fade;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    src.loopStart = 0.05; src.loopEnd = 10 - 0.05;
    return src;
  }, []);

  const stopCurrent = useCallback((fadeMs = 500): Promise<void> => {
    return new Promise((resolve) => {
      const g = gainRef.current; const ctx = ctxRef.current;
      if (!g || !ctx) { resolve(); return; }
      const t = ctx.currentTime;
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0.0001, t + fadeMs / 1000);
      setTimeout(() => {
        try { srcRef.current?.stop(); } catch { /* already stopped */ }
        srcRef.current = null;
        resolve();
      }, fadeMs + 60);
    });
  }, []);

  const play = useCallback(async (idx: number) => {
    // Fade out existing
    if (srcRef.current) await stopCurrent(400);

    // Create or reuse AudioContext
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new Ctor();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();

    // Build chain: source → filter → gain → destination
    const gain   = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainRef.current = gain;

    const filt = ctx.createBiquadFilter();
    if (idx === 1) { filt.type = "bandpass"; filt.frequency.value = 3500; filt.Q.value = 0.5; }
    else if (idx === 3) { filt.type = "lowpass"; filt.frequency.value = 350; filt.Q.value = 0.5; }
    else if (idx === 4) { filt.type = "bandpass"; filt.frequency.value = 750; filt.Q.value = 0.6; }
    else { filt.type = "lowpass"; filt.frequency.value = 2000; filt.Q.value = 0.7; }
    filterRef.current = filt;

    const src = makeNoise(ctx, idx);
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start(0);
    srcRef.current = src;

    // Fade in
    gain.gain.linearRampToValueAtTime(volRef.current, ctx.currentTime + 0.85);
    setActive(true); setPreset(idx);
  }, [stopCurrent, makeNoise]);

  const stop = useCallback(async () => {
    await stopCurrent(600);
    setActive(false); setPreset(-1);
  }, [stopCurrent]);

  const toggle = useCallback((idx: number) => {
    if (active && preset === idx) stop();
    else play(idx);
  }, [active, preset, stop, play]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setTargetAtTime(v, ctxRef.current.currentTime, 0.08);
    }
  }, []);

  // Cleanup
  useEffect(() => () => {
    try { srcRef.current?.stop(); ctxRef.current?.close(); } catch { /* ignore */ }
  }, []);

  return { active, preset, toggle, volume, setVolume };
}

/* ─── Main FocusMode ──────────────────────────── */
export function FocusMode() {
  const {
    focusMode, activeSession, sessionStatus, sessionSeconds, sessionDuration,
    sessionNotes, setSessionNotes, startSession, pauseSession, resumeSession, endSession, addTime,
    showSummaryModal, setShowSummaryModal, completedSessionStats, setCompletedSessionStats,
    cognitiveMetrics, aiInsights, distractions, incrementDistractions,
  } = useOS();

  // ── Ritual state ──
  const [showRitual,         setShowRitual]         = useState(false);
  const [pendingType,        setPendingType]         = useState<SessionType>("deep-work");
  const [pendingDuration,    setPendingDuration]     = useState(25);
  const [missionText,        setMissionText]         = useState("");

  // ── UI state ──
  const [aiMsg,        setAiMsg]        = useState("Initialising cognitive environment…");
  const [aiMsgKey,     setAiMsgKey]     = useState(0);
  const [notesFocused, setNotesFocused] = useState(false);
  const [timeFlash,    setTimeFlash]    = useState(false);
  const [quote,        setQuote]        = useState("The deeper the focus, the higher the clarity.");
  const [exitConfirm,  setExitConfirm]  = useState(false);
  const exitTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { active: soundActive, preset: soundPreset, toggle: toggleSound, volume: soundVolume, setVolume: setSoundVolume } = useAmbientAudio();

  const currentSessionType = activeSession ?? "deep-work";
  const elapsed   = sessionStatus === "idle" ? 0 : sessionDuration - sessionSeconds;
  const metrics   = computeMetrics(elapsed, distractions);
  const progress  = sessionDuration > 0 ? elapsed / sessionDuration : 0;
  const liveState = getLiveState(elapsed);

  const stateCol: Record<string, string>  = { Initialising: "rgba(148,162,218,0.70)", Building: "rgba(115,185,255,0.80)", Flowing: "rgba(95,222,182,0.85)", Peak: "rgba(158,242,140,0.90)", Fading: "rgba(202,162,100,0.75)" };
  const loadCol: Record<string, string>   = { Low: "rgba(138,222,160,0.80)", Optimal: "rgba(125,200,255,0.85)", High: "rgba(232,182,82,0.85)", Critical: "rgba(232,100,82,0.90)" };
  const resistCol: Record<string, string> = { Low: "rgba(232,100,82,0.85)", Medium: "rgba(232,182,82,0.85)", High: "rgba(125,200,255,0.85)", Extreme: "rgba(138,222,160,0.90)" };

  const QUOTES = [
    "The deeper the focus, the higher the clarity.",
    "Elite performance begins in silence.",
    "Your best work lives in the present moment.",
    "Focus is the gateway to mastery.",
    "Depth of attention creates breadth of capability.",
    "In the silence of focus, greatness is built.",
  ];

  /* ── Adaptive AI message (from ai-core behavioral engine) ── */
  const updateAiMsg = useCallback(() => {
    const msg = getAdaptiveAIMessage({
      sessionStatus: sessionStatus === "completed" ? "idle" : sessionStatus,
      elapsed,
      distractions,
      focusScore: Math.min(100, 70 + progress * 30 - distractions * 4),
      timeOfDay: getTimeOfDayNow(),
      momentumTrend: cognitiveMetrics.momentumEvolution > 55 ? "rising" : cognitiveMetrics.momentumEvolution < 40 ? "declining" : "stable",
      burnoutRisk: cognitiveMetrics.cognitiveStability < 35 ? "high" : cognitiveMetrics.cognitiveStability < 60 ? "moderate" : "low",
      streak: cognitiveMetrics.currentStreak,
    });
    setAiMsg(msg);
    setAiMsgKey(k => k + 1);
  }, [sessionStatus, elapsed, distractions, progress, cognitiveMetrics]);

  useEffect(() => {
    if (!focusMode) return;
    updateAiMsg();
    const interval = sessionStatus === "paused" ? 12000 : 9000;
    const id = setInterval(updateAiMsg, interval);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMode, sessionStatus, elapsed, distractions]);

  /* ── Quote rotation ── */
  useEffect(() => {
    if (!focusMode) return;
    const id = setInterval(() => setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]), 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMode]);

  /* ── Exit handler ── */
  const handleExit = useCallback(() => {
    if (sessionStatus === "running" && !exitConfirm) {
      setExitConfirm(true);
      exitTimerRef.current = setTimeout(() => setExitConfirm(false), 4000);
      return;
    }
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    setExitConfirm(false);
    endSession(true);
  }, [exitConfirm, sessionStatus, endSession]);

  useEffect(() => () => { if (exitTimerRef.current) clearTimeout(exitTimerRef.current); }, []);

  /* ── Ritual handlers ── */
  const requestStartSession = useCallback((type: SessionType, mins: number) => {
    setPendingType(type);
    setPendingDuration(mins);
    setShowRitual(true);
  }, []);

  const handleRitualConfirm = useCallback((mission: string) => {
    setShowRitual(false);
    setMissionText(mission);
    startSession(pendingType, pendingDuration);
  }, [pendingType, pendingDuration, startSession]);

  const handleRitualDismiss = useCallback(() => {
    setShowRitual(false);
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); handleExit(); }
      if (e.key === " " && !notesFocused) {
        e.preventDefault();
        if (sessionStatus === "running") pauseSession();
        else if (sessionStatus === "paused") resumeSession();
        else requestStartSession(currentSessionType, sessionDuration / 60);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMode, sessionStatus, notesFocused, exitConfirm, currentSessionType, sessionDuration]);

  /* ── Derived scores ── */
  const focusQ    = Math.round(Math.min(100, 70 + progress * 30 - distractions * 4));
  const depthS    = Math.round(Math.min(100, 60 + progress * 40 - distractions * 3));
  const consiS    = Math.round(Math.min(100, 75 + elapsed / 120 - distractions * 5));
  const noteCount = sessionNotes.trim().split(/\s+/).filter(Boolean).length;
  const now       = new Date();
  const fmtTime   = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const peakStart = new Date(now.getTime() + 30 * 60_000);
  const peakEnd   = new Date(now.getTime() + 150 * 60_000);

  // Derive top AI insight for display (most confident, non-streak)
  const topInsight = aiInsights.find(i => i.id !== "streak" && i.id !== "onboarding") ?? aiInsights[0];

  return (
    <>
      {/* ── SESSION RITUAL ── */}
      <AnimatePresence>
        {showRitual && (
          <SessionRitual
            sessionType={pendingType}
            durationMins={pendingDuration}
            onConfirm={handleRitualConfirm}
            onDismiss={handleRitualDismiss}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 overflow-hidden"
            style={{
              zIndex: 40,
              background: "linear-gradient(180deg, #050814 0%, #040711 55%, #060918 100%)",
            }}
          >
            {/* Mountain landscape */}
            <MountainBackground status={sessionStatus} />

            {/* Particles + atmospheric fog */}
            <ParticleCanvas active={sessionStatus === "running"} />
            <AmbientFog status={sessionStatus} />

            {/* ── TOP HUD ── */}
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3.5"
              style={{ zIndex: 10, borderBottom: "1px solid rgba(90,115,255,0.06)" }}
            >
              {/* Live state */}
              <AnimatePresence mode="wait">
                <motion.div key={liveState.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="flex items-center gap-2">
                  <motion.span className="h-2 w-2 rounded-full shrink-0" style={{ background: liveState.colour }}
                    animate={{ opacity: [1, 0.25, 1], scale: [1, 1.35, 1] }} transition={{ duration: 2.2, repeat: Infinity }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: liveState.colour }}>{liveState.label}</span>
                  {/* Cognitive rank badge */}
                  {cognitiveMetrics.currentStreak > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,165,60,0.08)", border: "1px solid rgba(255,165,60,0.18)" }}>
                      <Flame className="h-2.5 w-2.5" style={{ color: "rgba(255,155,60,0.75)" }} />
                      <span className="text-[9px] font-bold" style={{ color: "rgba(255,155,60,0.75)" }}>{cognitiveMetrics.currentStreak}d</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Adaptive AI companion — color shifts with distraction state */}
              <AnimatePresence mode="wait">
                <motion.div key={aiMsgKey}
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.7 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{
                    background: distractions > 2 ? "rgba(192,65,45,0.10)" : "rgba(45,65,192,0.11)",
                    border: distractions > 2 ? "1px solid rgba(255,130,95,0.18)" : "1px solid rgba(95,130,255,0.14)",
                    color: distractions > 2 ? "rgba(255,168,140,0.85)" : "rgba(158,192,255,0.82)",
                    fontSize: 11,
                    transition: "all 0.5s ease",
                  }}
                >
                  <Brain className="h-3 w-3 shrink-0" style={{ color: distractions > 2 ? "#ff7855" : "#6282ff", transition: "color 0.4s ease" }} />
                  {aiMsg}
                </motion.div>
              </AnimatePresence>

              {/* Exit */}
              <AnimatePresence mode="wait">
                {exitConfirm ? (
                  <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: "rgba(255,175,95,0.82)" }}>Click again to exit</span>
                    <Btn onClick={handleExit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{ background: "rgba(255,75,55,0.18)", border: "1px solid rgba(255,95,75,0.35)", color: "rgba(255,158,138,0.95)" }}>
                      <X className="h-3 w-3" /> Confirm Exit
                    </Btn>
                    <Btn onClick={() => setExitConfirm(false)} className="px-2 py-1.5 rounded-lg text-[11px]"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(175,190,228,0.48)" }}>
                      Cancel
                    </Btn>
                  </motion.div>
                ) : (
                  <motion.div key="exit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Btn onClick={handleExit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                      style={{ background: "rgba(255,75,75,0.07)", border: "1px solid rgba(255,100,100,0.13)", color: "rgba(255,150,150,0.68)" }}>
                      <X className="h-3 w-3" /> Exit Deep Mode
                    </Btn>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── MAIN LAYOUT ── */}
            <div className="absolute inset-0 flex items-start pt-14" style={{ zIndex: 5 }}>

              {/* LEFT PANEL */}
              <motion.div
                initial={{ opacity: 0, x: -48 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.28, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="w-[255px] shrink-0 flex flex-col gap-3 p-5 h-full overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {/* Mission */}
                <GlassPanel>
                  <div className="text-[9px] font-bold uppercase tracking-[0.28em] mb-2.5" style={{ color: "rgba(110,135,255,0.55)" }}>Current Mission</div>
                  <div className="text-[15px] font-bold mb-1.5 leading-snug" style={{ background: "linear-gradient(135deg, #c0d2ff, #7a8acf)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    {currentSessionType === "deep-work" ? "Deep Work: AI System" : currentSessionType === "learning" ? "Learning Block" : currentSessionType === "workout" ? "Physical Training" : "Reflection Session"}
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(152,168,215,0.50)" }}>
                    {currentSessionType === "deep-work" ? "Build and architect core systems. Stay in deep work flow." : currentSessionType === "learning" ? "Absorb, synthesise, and retain new knowledge structures." : currentSessionType === "workout" ? "Push physical limits. Neuroplasticity increases post-workout." : "Process, integrate, and crystallise recent experiences."}
                  </p>
                  <div className="mt-3 h-px" style={{ background: "rgba(95,120,255,0.08)" }} />
                </GlassPanel>

                {/* Focus energy */}
                <GlassPanel>
                  <div className="text-[9px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: "rgba(110,135,255,0.55)" }}>Focus Energy</div>
                  <svg width="100%" height="26" viewBox="0 0 200 26" className="mb-3 opacity-55">
                    <polyline
                      points={Array.from({ length: 44 }, (_, i) => {
                        const x = (i / 43) * 200;
                        const y = 13 + Math.sin(i * 0.75 + elapsed * 0.012) * 5.5 + Math.sin(i * 1.5 + elapsed * 0.018) * 2.5;
                        return `${x},${y}`;
                      }).join(" ")}
                      fill="none" stroke="rgba(85,140,255,0.55)" strokeWidth="1.5"
                    />
                  </svg>
                  <div className="divide-y" style={{ borderColor: "rgba(95,120,255,0.05)" }}>
                    <MetricRow label="Focus State"        value={metrics.focusState}        colour={stateCol[metrics.focusState]}   />
                    <MetricRow label="Cognitive Load"     value={metrics.cognitiveLoad}     colour={loadCol[metrics.cognitiveLoad]} />
                    <MetricRow label="Distraction Resist" value={metrics.distractionResist} colour={resistCol[metrics.distractionResist]} />
                    <MetricRow label="Mental Energy"      value={`${metrics.mentalEnergy}%`} colour={metrics.mentalEnergy > 70 ? "rgba(135,220,160,0.90)" : "rgba(230,180,80,0.85)"} />
                  </div>
                </GlassPanel>

                {/* Ambient sound */}
                <GlassPanel>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.28em]" style={{ color: "rgba(110,135,255,0.55)" }}>Ambient Sound</div>
                    {soundActive && (
                      <motion.div className="flex items-center gap-1 text-[9px]" style={{ color: "rgba(125,205,178,0.75)" }}
                        animate={{ opacity: [1, 0.45, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#58ccaa", display: "inline-block" }} />
                        Playing
                      </motion.div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {SOUND_PRESETS.map((p, i) => {
                      const Icon     = p.icon;
                      const isActive = soundActive && soundPreset === i;
                      const [r, g, b] = [parseInt(p.colour.slice(1,3),16), parseInt(p.colour.slice(3,5),16), parseInt(p.colour.slice(5,7),16)];
                      return (
                        <motion.button key={p.label} onClick={() => toggleSound(i)}
                          whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 22 }}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[11px] text-left w-full"
                          style={{
                            background: isActive ? `rgba(${r},${g},${b},0.14)` : "rgba(255,255,255,0.025)",
                            border: isActive ? `1px solid rgba(${r},${g},${b},0.30)` : "1px solid rgba(255,255,255,0.04)",
                            color: isActive ? p.colour : "rgba(152,168,212,0.50)",
                            boxShadow: isActive ? `0 0 14px rgba(${r},${g},${b},0.10)` : "none",
                            transition: "all 0.25s ease",
                          }}>
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate font-medium">{p.label}</span>
                            <span className="text-[9px] opacity-55 truncate">{p.desc}</span>
                          </div>
                          {isActive && (
                            <div className="ml-auto flex items-end gap-px shrink-0">
                              {[1,2,3].map((bar) => (
                                <motion.span key={bar} className="w-[3px] rounded-full" style={{ background: p.colour }}
                                  animate={{ height: [`${bar*3+2}px`, `${bar*5+6}px`, `${bar*3+2}px`] }}
                                  transition={{ duration: 0.75 + bar * 0.2, repeat: Infinity, ease: "easeInOut", delay: bar * 0.12 }} />
                              ))}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  {/* Volume */}
                  <div className="flex items-center gap-2.5 mt-3.5">
                    <VolumeX className="h-3 w-3 shrink-0" style={{ color: "rgba(145,165,218,0.28)" }} />
                    <div className="flex-1 relative h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full pointer-events-none" style={{ width: `${soundVolume * 100}%`, background: "linear-gradient(90deg, #334fc0, #72a8ff)", transition: "width 0.12s ease" }} />
                      <input type="range" min={0} max={1} step={0.01} value={soundVolume}
                        onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    </div>
                    <Volume2 className="h-3 w-3 shrink-0" style={{ color: "rgba(145,165,218,0.28)" }} />
                  </div>
                </GlassPanel>

                {/* Quote */}
                <AnimatePresence mode="wait">
                  <motion.div key={quote} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
                    className="px-4 py-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(95,120,255,0.07)" }}>
                    <div className="text-2xl font-bold mb-1.5" style={{ color: "rgba(110,135,255,0.32)" }}>"</div>
                    <p className="text-[11px] leading-relaxed italic" style={{ color: "rgba(155,172,218,0.52)" }}>{quote}</p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* CENTER */}
              <div className="flex-1 flex flex-col items-center justify-between py-5 h-full min-w-0">
                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                  <motion.div initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.18, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}>
                    <FocusReactor seconds={sessionSeconds} duration={sessionDuration} status={sessionStatus} sessionType={activeSession ?? "deep-work"} />
                  </motion.div>

                  <motion.p className="text-[11.5px] italic text-center max-w-[230px]" style={{ color: "rgba(140,162,218,0.36)" }}
                    animate={{ opacity: [0.36, 0.60, 0.36] }} transition={{ duration: 9, repeat: Infinity }}>
                    "{quote}"
                  </motion.p>
                </div>

                {/* Controls */}
                <div className="w-full flex flex-col items-center gap-4 pb-5 px-4">
                  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.72 }} className="flex items-center gap-7">

                    {/* +15 min */}
                    <div className="flex flex-col items-center gap-1.5">
                      <Btn onClick={() => { addTime(15); setTimeFlash(true); setTimeout(() => setTimeFlash(false), 650); }}
                        className="h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ background: timeFlash ? "rgba(95,155,255,0.18)" : "rgba(255,255,255,0.04)", border: timeFlash ? "1px solid rgba(95,155,255,0.35)" : "1px solid rgba(255,255,255,0.08)", boxShadow: timeFlash ? "0 0 22px rgba(95,155,255,0.25)" : "none", transition: "all 0.30s ease" }}>
                        <Plus className="h-4 w-4" style={{ color: timeFlash ? "rgba(135,188,255,0.95)" : "rgba(150,172,255,0.50)" }} />
                      </Btn>
                      <span className="text-[9px]" style={{ color: "rgba(140,162,218,0.36)" }}>+15 min</span>
                    </div>

                    {/* Pause / Resume */}
                    <div className="flex flex-col items-center gap-1.5">
                      <Btn
                        onClick={() => {
                          if (sessionStatus === "running") pauseSession();
                          else if (sessionStatus === "paused") resumeSession();
                          else requestStartSession(currentSessionType, sessionDuration / 60);
                        }}
                        className="relative h-[70px] w-[70px] rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, rgba(62,95,220,0.46), rgba(45,76,195,0.36))", border: "1px solid rgba(95,140,255,0.32)", boxShadow: sessionStatus === "running" ? "0 0 38px rgba(70,115,255,0.30), 0 0 75px rgba(50,95,230,0.14)" : "0 0 16px rgba(70,115,255,0.12)", transition: "box-shadow 0.5s ease" }}
                      >
                        <AnimatePresence mode="wait">
                          {sessionStatus === "running"
                            ? <motion.div key="pause"  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.17 }}><Pause className="h-6 w-6" style={{ color: "rgba(198,218,255,0.92)" }} /></motion.div>
                            : sessionStatus === "paused"
                            ? <motion.div key="play"   initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.17 }}><Play  className="h-6 w-6 ml-1" style={{ color: "rgba(198,218,255,0.92)" }} /></motion.div>
                            : <motion.div key="start"  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.17 }}><Target className="h-6 w-6" style={{ color: "rgba(198,218,255,0.92)" }} /></motion.div>
                          }
                        </AnimatePresence>
                        {sessionStatus === "running" && (
                          <motion.div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(95,140,255,0.40)" }}
                            animate={{ scale: [1, 1.38, 1], opacity: [0.65, 0, 0.65] }} transition={{ duration: 3, repeat: Infinity }} />
                        )}
                      </Btn>
                      <span className="text-[9px]" style={{ color: "rgba(140,162,218,0.38)" }}>
                        {sessionStatus === "running" ? "Pause  [Space]" : sessionStatus === "paused" ? "Resume  [Space]" : "Begin  [Space]"}
                      </span>
                    </div>

                    {/* End session */}
                    <div className="flex flex-col items-center gap-1.5">
                      <Btn onClick={() => endSession(false)} className="h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Check className="h-4 w-4" style={{ color: "rgba(95,222,162,0.72)" }} />
                      </Btn>
                      <span className="text-[9px]" style={{ color: "rgba(140,162,218,0.36)" }}>End Session</span>
                    </div>
                  </motion.div>

                  {/* Notes */}
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.68 }}
                    className="w-full max-w-lg flex items-start gap-3 px-4 py-3 rounded-2xl"
                    style={{
                      background: notesFocused ? "rgba(45,66,192,0.09)" : "rgba(255,255,255,0.022)",
                      border: notesFocused ? "1px solid rgba(95,140,255,0.22)" : "1px solid rgba(255,255,255,0.045)",
                      boxShadow: notesFocused ? "0 0 26px rgba(70,115,255,0.09)" : "none",
                      transition: "all 0.35s ease",
                    }}
                  >
                    <Mic className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "rgba(110,142,255,0.38)" }} />
                    <textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      onFocus={() => setNotesFocused(true)}
                      onBlur={() => setNotesFocused(false)}
                      rows={2}
                      placeholder="Capture thoughts, breakthroughs, or ideas…"
                      className="flex-1 bg-transparent resize-none outline-none text-[11.5px] leading-relaxed"
                      style={{ color: "rgba(198,212,255,0.80)", caretColor: "rgba(110,148,255,0.82)", fontFamily: "inherit" }}
                    />
                    <span className="text-[9.5px] shrink-0 mt-0.5" style={{ color: "rgba(110,132,198,0.32)" }}>
                      {noteCount}w
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* RIGHT PANEL */}
              <motion.div
                initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.34, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="w-[255px] shrink-0 flex flex-col gap-3 p-5 h-full overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {/* AI Insights — from persistent memory */}
                <GlassPanel>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Brain className="h-3.5 w-3.5 shrink-0" style={{ color: "#6282ff" }} />
                    <span className="text-[9px] font-bold uppercase tracking-[0.28em]" style={{ color: "rgba(110,135,255,0.55)" }}>AI Insights</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p key={aiMsgKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.52 }}
                      className="text-[13.5px] font-semibold leading-snug mb-4"
                      style={{ background: "linear-gradient(135deg, #8caeff, #5472de)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      {aiMsg}
                    </motion.p>
                  </AnimatePresence>
                  {/* Persistent insight from ai-core memory */}
                  {topInsight && (
                    <motion.div
                      className="mb-3 px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(50,72,195,0.08)", border: "1px solid rgba(90,120,255,0.10)" }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    >
                      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(110,138,255,0.42)" }}>Memory Insight</div>
                      <p className="text-[11px] leading-snug" style={{ color: "rgba(165,185,255,0.70)" }}>{topInsight.message}</p>
                    </motion.div>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 text-[10.5px]" style={{ color: "rgba(155,172,218,0.58)" }}>
                      <Shield className="h-3 w-3 shrink-0" style={{ color: distractions === 0 ? "#58ccaa" : "#de9e3a" }} /><span>{distractions === 0 ? "Distraction probability low" : `${distractions} distraction${distractions > 1 ? "s" : ""} detected`}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10.5px]" style={{ color: "rgba(155,172,218,0.58)" }}>
                      <Clock className="h-3 w-3 shrink-0" style={{ color: "#78aaff" }} />
                      <div>
                        <div>Peak focus window</div>
                        <div className="text-[10px] font-semibold" style={{ color: "rgba(135,172,255,0.82)" }}>{fmtTime(peakStart)} – {fmtTime(peakEnd)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10.5px]" style={{ color: "rgba(155,172,218,0.58)" }}>
                      <Zap className="h-3 w-3 shrink-0" style={{ color: "#deba58" }} />
                      <div>
                        <div>Operator Rank</div>
                        <div className="text-[10px] font-semibold" style={{ color: "rgba(218,190,100,0.82)" }}>{cognitiveMetrics.operatorRank}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10.5px]" style={{ color: "rgba(155,172,218,0.58)" }}>
                      <SkipForward className="h-3 w-3 shrink-0" style={{ color: "#de7c5a" }} />
                      <div>
                        <div>Break recommended in</div>
                        <div className="text-[10px] font-semibold" style={{ color: "rgba(218,152,100,0.82)" }}>{Math.max(5, 90 - Math.floor(elapsed / 60))} min</div>
                      </div>
                    </div>
                  </div>
                </GlassPanel>

                {/* Session Progress */}
                <GlassPanel>
                  <div className="text-[9px] font-bold uppercase tracking-[0.28em] mb-4" style={{ color: "rgba(110,135,255,0.55)" }}>Session Progress</div>
                  <ProgressBar label="Focus Quality"  value={focusQ} />
                  <ProgressBar label="Depth Score"    value={depthS} />
                  <ProgressBar label="Consistency"    value={consiS} />
                  <div className="flex justify-between text-[10px] items-center mt-1">
                    <span style={{ color: "rgba(172,185,220,0.48)" }}>Momentum</span>
                    <span className="font-semibold" style={{ color: "rgba(125,158,255,0.90)" }}>
                      {metrics.momentumStability > 70 ? "High" : metrics.momentumStability > 40 ? "Building" : "Low"}
                    </span>
                  </div>
                </GlassPanel>

                {/* Protection Shield - now shows real distraction data */}
                <GlassPanel>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] font-bold uppercase tracking-[0.28em]" style={{ color: "rgba(110,135,255,0.55)" }}>Focus Protection</div>
                    <Shield className="h-3 w-3" style={{ color: distractions === 0 ? "#58ccaa" : distractions > 3 ? "#de4a3a" : "#de9e3a" }} />
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.div className="text-3xl font-bold font-mono"
                      style={{ background: distractions === 0 ? "linear-gradient(135deg, #58ccaa, #38aa82)" : distractions > 3 ? "linear-gradient(135deg, #de4a3a, #be2a1a)" : "linear-gradient(135deg, #de9e3a, #be7e1a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                      key={distractions} animate={{ scale: [1.25, 1] }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
                      {distractions}
                    </motion.div>
                    <div>
                      <div className="text-[11px] font-semibold" style={{ color: "rgba(175,198,255,0.70)" }}>Interruptions</div>
                      <div className="text-[10px]" style={{ color: "rgba(135,158,218,0.42)" }}>
                        {distractions === 0 ? "Focus fully protected" : distractions <= 2 ? "Integrity stable" : "Recovery in progress"}
                      </div>
                    </div>
                  </div>
                  {/* Mini distraction timeline */}
                  {distractions > 0 && (
                    <div className="mt-2.5 flex items-center gap-1">
                      {Array.from({ length: Math.min(distractions, 8) }).map((_, i) => (
                        <motion.div key={i} className="h-1.5 rounded-full flex-1"
                          style={{ background: i < 3 ? "rgba(218,158,60,0.55)" : "rgba(218,75,60,0.60)" }}
                          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.08 }} />
                      ))}
                    </div>
                  )}
                </GlassPanel>

                {/* Up next */}
                <GlassPanel>
                  <div className="text-[9px] font-bold uppercase tracking-[0.28em] mb-2" style={{ color: "rgba(110,135,255,0.55)" }}>Up Next</div>
                  <div className="text-[10.5px] mb-1" style={{ color: "rgba(145,165,218,0.48)" }}>
                    {fmtTime(new Date(Date.now() + sessionSeconds * 1000))} – Recovery
                  </div>
                  <div className="text-[12px] font-semibold" style={{ color: "rgba(175,198,255,0.80)" }}>Review & Refine</div>
                </GlassPanel>

                {/* Cognitive Evolution */}
                <GlassPanel>
                  <div className="text-[9px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: "rgba(110,135,255,0.55)" }}>Cognitive Evolution</div>
                  <div className="space-y-2">
                    {[
                      { label: "Focus Integrity",   value: cognitiveMetrics.focusIntegrity,   color: "#78aaff" },
                      { label: "Neural Alignment",  value: cognitiveMetrics.neuralAlignment,  color: "#58ccaa" },
                      { label: "Recovery Balance",  value: cognitiveMetrics.recoveryBalance,  color: "#9c7cff" },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span style={{ color: "rgba(155,172,218,0.50)" }}>{m.label}</span>
                          <span className="font-mono font-semibold" style={{ color: m.color }}>{m.value}%</span>
                        </div>
                        <div className="h-[2px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <motion.div className="h-full rounded-full"
                            style={{ background: m.color, opacity: 0.75 }}
                            initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(95,120,255,0.06)" }}>
                    <div className="text-[9px]" style={{ color: "rgba(138,158,218,0.40)" }}>Deep Hours</div>
                    <div className="text-[12px] font-bold font-mono" style={{ color: "rgba(145,175,255,0.85)" }}>{cognitiveMetrics.totalDeepHours}h</div>
                  </div>
                </GlassPanel>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMPLETION CINEMATIC ── */}
      <AnimatePresence>
        {showSummaryModal && completedSessionStats && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 50, background: "radial-gradient(ellipse 85% 65% at 50% 0%, rgba(30,45,170,0.20), transparent 58%), rgba(3,5,16,0.94)", backdropFilter: "blur(22px)" }}
          >
            <ParticleCanvas active={true} />
            <motion.div
              initial={{ scale: 0.88, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.93, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 275, damping: 22 }}
              className="w-full max-w-[515px] rounded-3xl p-8 relative"
              style={{ zIndex: 10, background: "linear-gradient(148deg, rgba(9,12,32,0.99), rgba(6,8,24,0.99))", border: "1px solid rgba(95,130,255,0.16)", boxShadow: "0 0 0 1px rgba(255,255,255,0.032) inset, 0 50px 140px rgba(0,0,0,0.88), 0 0 95px rgba(50,85,255,0.10)" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-38 pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(65,105,255,0.18), transparent 68%)", filter: "blur(26px)" }} />
              <div className="relative flex flex-col items-center text-center">
                <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 245, damping: 15, delay: 0.18 }}
                  className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "linear-gradient(135deg, rgba(50,80,220,0.32), rgba(35,62,195,0.22))", border: "1px solid rgba(95,140,255,0.26)", boxShadow: "0 0 52px rgba(70,115,255,0.24)" }}>
                  <Smile className="h-8 w-8" style={{ color: "#78aaff" }} />
                </motion.div>

                <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                  className="text-[10px] font-bold uppercase tracking-[0.32em] mb-2" style={{ color: "rgba(115,158,255,0.68)" }}>
                  Session Complete
                </motion.span>
                <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
                  className="text-2xl font-bold mb-1.5"
                  style={{ background: "linear-gradient(135deg, #d8e5ff, #8595d5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {completedSessionStats.score >= 90 ? "Exceptional Session" : completedSessionStats.score >= 75 ? "Excellent Session" : completedSessionStats.score >= 55 ? "Solid Session" : "Session Complete"}
                </motion.h3>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="text-[12px] mb-6" style={{ color: "rgba(155,172,220,0.52)" }}>
                  Focus stability remained high for <span className="font-semibold" style={{ color: "rgba(152,198,255,0.82)" }}>{completedSessionStats.duration} minutes</span>. Momentum strengthened.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }} className="w-full grid grid-cols-3 gap-2.5 mb-5">
                  {[
                    { label: "Duration",     value: `${completedSessionStats.duration}m`,  colour: "#78aaff" },
                    { label: "Flow Quality", value: completedSessionStats.focusQuality,     colour: "#58ccaa" },
                    { label: "Integrity",    value: `${completedSessionStats.score}%`,      colour: "#deba58" },
                    { label: "Interruptions", value: `${completedSessionStats.distractions}`, colour: completedSessionStats.distractions === 0 ? "#58ccaa" : "#de9e3a" },
                    { label: "Momentum",     value: "Rising",                               colour: "#9c7cff" },
                    { label: "Stability",    value: "High",                                 colour: "#58ccaa" },
                  ].map((stat, idx) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 + idx * 0.055 }}
                      className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.022)", border: "1px solid rgba(255,255,255,0.048)" }}>
                      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(155,172,218,0.42)" }}>{stat.label}</div>
                      <div className="text-[13px] font-bold" style={{ color: stat.colour }}>{stat.value}</div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.58 }}
                  className="w-full rounded-2xl p-4 mb-5 text-left"
                  style={{ background: "rgba(45,65,192,0.08)", border: "1px solid rgba(95,130,255,0.11)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-3 w-3" style={{ color: "#6282ff" }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(110,145,255,0.58)" }}>AI Cognitive Summary</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(165,182,226,0.72)" }}>
                    {completedSessionStats.type === "deep-work"
                      ? `Flow sustained for ${completedSessionStats.duration}m. Cognitive stability remains high. Consider a 5–10 minute recovery before initiating further tasks. Neural coherence elevated — ideal for creative or strategic work next.`
                      : completedSessionStats.type === "workout"
                      ? "Physical activity drives cognitive restoration. Your next project session benefits from increased neuroplasticity and improved working memory."
                      : completedSessionStats.type === "learning"
                      ? "Learning block complete. Knowledge retention index increased. Consolidate with light review before moving to application tasks."
                      : "Reflection complete. Self-awareness index elevated. Emotional coherence high — excellent time for journaling or strategic planning."}
                  </p>
                </motion.div>

                {completedSessionStats.notes && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.64 }}
                    className="w-full rounded-xl px-3.5 py-2.5 mb-4 text-left"
                    style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(145,162,212,0.38)" }}>Session Notes</div>
                    <p className="text-[11px] italic" style={{ color: "rgba(165,182,226,0.58)" }}>"{completedSessionStats.notes}"</p>
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.68 }}
                  whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowSummaryModal(false); setCompletedSessionStats(null); }}
                  className="w-full py-3.5 rounded-2xl text-[13.5px] font-semibold"
                  style={{ background: "linear-gradient(135deg, rgba(65,100,225,0.62), rgba(46,80,198,0.52))", border: "1px solid rgba(95,140,255,0.30)", color: "rgba(208,222,255,0.95)", boxShadow: "0 0 36px rgba(70,115,255,0.24), 0 5px 18px rgba(0,0,0,0.32)" }}>
                  Return to Operator Workspace
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
