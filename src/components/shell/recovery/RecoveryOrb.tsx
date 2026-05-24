import { motion, AnimatePresence } from "framer-motion";
import type { BreathState } from "./BreathingEngine";

interface RecoveryOrbProps {
  breathState: BreathState;
  sessionRunning: boolean;
  sessionSeconds: number;
  sessionDuration: number;
  ambientTone?: string;
}

const TONE_GLOW_MAP: Record<string, { tone: string; glow: string; text: string }> = {
  ocean:   { tone: "rgba(30,130,220,",  glow: "rgba(50,150,250,0.18)",  text: "rgba(160,215,255,0.95)" },
  forest:  { tone: "rgba(40,160,100,",  glow: "rgba(60,195,120,0.18)",  text: "rgba(170,240,200,0.95)" },
  rain:    { tone: "rgba(70,120,200,",  glow: "rgba(90,145,230,0.18)",  text: "rgba(180,210,255,0.95)" },
  space:   { tone: "rgba(100,70,220,",  glow: "rgba(130,100,250,0.18)", text: "rgba(200,180,255,0.95)" },
  healing: { tone: "rgba(160,90,240,",  glow: "rgba(185,120,255,0.18)", text: "rgba(220,185,255,0.95)" },
  wind:    { tone: "rgba(90,170,210,",  glow: "rgba(110,190,230,0.18)", text: "rgba(175,225,250,0.95)" },
  noise:   { tone: "rgba(145,115,80,",  glow: "rgba(175,140,100,0.18)", text: "rgba(225,200,170,0.95)" },
  night:   { tone: "rgba(45,60,140,",   glow: "rgba(70,90,190,0.18)",   text: "rgba(170,185,245,0.95)" },
  default: { tone: "rgba(90,140,255,",  glow: "rgba(110,165,255,0.18)", text: "rgba(195,215,255,0.95)" },
};

export function RecoveryOrb({
  breathState,
  sessionRunning,
  sessionSeconds,
  sessionDuration,
  ambientTone = "default",
}: RecoveryOrbProps) {
  const { phase, progress, cycle, running } = breathState;
  
  const colors = TONE_GLOW_MAP[ambientTone] ?? TONE_GLOW_MAP.default;
  const toneGlow = colors.tone;

  const sessionProgress = sessionDuration > 0
    ? Math.min(1.0, (sessionDuration - sessionSeconds) / sessionDuration)
    : 0;

  const SIZE = 360;
  const C = SIZE / 2;
  const R_OUTER = 160;
  const R_MID   = 138;
  const R_INNER = 115;
  const circ = (r: number) => 2 * Math.PI * r;

  // Cinematic scaling configuration
  const getScaleAnimation = () => {
    if (!sessionRunning || !running) return 1.0;
    if (phase === "inhale") return 1.34;
    if (phase === "exhale") return 0.94;
    if (phase === "hold") return [1.34, 1.352, 1.34]; // Micro-vibration pulse for breath holding
    return 0.94;
  };

  const getTransition = (): any => {
    if (phase === "hold") {
      return {
        scale: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }
      };
    }
    const dur = phase === "inhale" ? breathState.pattern.inhale : breathState.pattern.exhale;
    return {
      scale: {
        duration: dur,
        ease: [0.45, 0.05, 0.25, 1.0], // Breathing respiratory curve
      }
    };
  };

  const getOpacityAnimation = () => {
    if (!sessionRunning || !running) return 0.35;
    if (phase === "inhale") return 0.88;
    if (phase === "hold") return 0.76;
    if (phase === "exhale") return 0.44;
    return 0.25;
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      {/* ── Outer soft volumetric aura ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -45,
          background: `radial-gradient(circle, ${toneGlow}0.09) 0%, ${toneGlow}0.02) 45%, transparent 70%)`,
          filter: "blur(60px)",
        }}
        animate={{
          scale: sessionRunning && running ? (phase === "inhale" || phase === "hold" ? 1.15 : 0.92) : 1.0,
          opacity: sessionRunning && running ? (phase === "inhale" ? 0.9 : phase === "hold" ? 0.85 : 0.4) : 0.25,
        }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -110,
          background: `radial-gradient(circle, ${toneGlow}0.04) 0%, transparent 60%)`,
          filter: "blur(90px)",
        }}
        animate={{
          opacity: sessionRunning && running ? [0.2, 0.4, 0.2] : 0.1,
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Reactor Core ── */}
      <motion.div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          inset: 34,
          background: running
            ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.08) 0%, ${toneGlow}0.06) 40%, ${toneGlow}0.18) 100%)`
            : "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 60%, rgba(255,255,255,0.03) 100%)",
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -1px 0 rgba(0,0,0,0.4),
            0 12px 60px rgba(0,0,0,0.65),
            0 0 45px ${toneGlow}0.08)
          `,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        animate={{
          scale: getScaleAnimation(),
          opacity: getOpacityAnimation(),
        }}
        transition={getTransition()}
      >
        {/* Core highlight flare */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: "8%", left: "10%", width: "45%", height: "35%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 75%)",
            filter: "blur(4px)",
          }}
        />

        {/* Dynamic breathing core liquid pulse */}
        {running && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${toneGlow}0.16) 0%, transparent 60%)`,
            }}
            animate={phase === "inhale"
              ? { scale: [0.85, 1.05, 0.9], opacity: 0.8 }
              : phase === "hold"
              ? { scale: [1.0, 1.02, 1.0], opacity: 0.6 }
              : { scale: [1.0, 0.75, 0.8], opacity: 0.3 }
            }
            transition={phase === "hold" ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 2.0 }}
          />
        )}
      </motion.div>

      {/* ── SVG Gauge Overlay ── */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 pointer-events-none"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      >
        <defs>
          <linearGradient id="session-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="60%" stopColor={colors.text} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.text.replace("0.95", "0.2")} stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="breath-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.text} stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
          <filter id="cinematic-blur">
            <feGaussianBlur stdDeviation="3.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer session track */}
        <circle cx={C} cy={C} r={R_OUTER} fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth={1.5} />
        
        {/* Dynamic active session progress arc */}
        {sessionRunning && (
          <motion.circle
            cx={C} cy={C} r={R_OUTER}
            fill="none"
            stroke="url(#session-grad)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circ(R_OUTER)}
            strokeDashoffset={circ(R_OUTER) * (1.0 - sessionProgress)}
            filter="url(#cinematic-blur)"
            animate={{ opacity: [0.65, 0.85, 0.65] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Middle decorative alignment ring */}
        <motion.circle
          cx={C} cy={C} r={R_MID}
          fill="none"
          stroke="rgba(255,255,255,0.02)"
          strokeWidth={1}
          strokeDasharray="6 32"
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />

        {/* Inner breath progress arc */}
        {running && (
          <motion.circle
            cx={C} cy={C} r={R_INNER}
            fill="none"
            stroke="url(#breath-grad)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={circ(R_INNER)}
            strokeDashoffset={circ(R_INNER) * (1.0 - progress)}
            filter="url(#cinematic-blur)"
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
        )}

        {/* Inner track border */}
        <circle cx={C} cy={C} r={R_INNER} fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth={1} />

        {/* Floating progress indicator dot */}
        {sessionRunning && sessionProgress > 0 && (
          <circle
            cx={C + R_OUTER * Math.cos(2 * Math.PI * sessionProgress)}
            cy={C + R_OUTER * Math.sin(2 * Math.PI * sessionProgress)}
            r={4}
            fill="#ffffff"
            filter="url(#cinematic-blur)"
          />
        )}
      </svg>

      {/* ── Reactor Typography Core ── */}
      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none z-10">
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              color: colors.text,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              marginBottom: "0.40rem",
            }}
          >
            {running ? phase : sessionRunning ? "Breathing" : "Select"}
          </motion.span>
        </AnimatePresence>

        {/* Precise Countdown or Timer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${phase}-${breathState.phaseSecondsLeft}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.95, scale: 1.0 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.22 }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "2.8rem",
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              background: "linear-gradient(to bottom, #ffffff 30%, rgba(255,255,255,0.7) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))",
            }}
          >
            {running ? breathState.phaseSecondsLeft : (
              sessionRunning ? formatTime(sessionSeconds) : "--"
            )}
          </motion.div>
        </AnimatePresence>

        {/* Small cycle status */}
        {cycle > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            style={{
              marginTop: "0.45rem",
              fontSize: "0.52rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            CYCLE {cycle + 1}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
