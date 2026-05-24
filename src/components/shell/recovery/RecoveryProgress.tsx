import { motion } from "framer-motion";

interface ProgressDimension {
  id: string;
  label: string;
  value: number;
  color: string;
  glow: string;
}

function computeDimensions(elapsed: number, duration: number, breathCycles: number): ProgressDimension[] {
  // Continuous fractional progress 0.0 -> 1.0
  const p = duration > 0 ? Math.min(1.0, elapsed / duration) : 0;
  const b = Math.min(1.0, breathCycles / 8);

  return [
    {
      id: "clarity",
      label: "Mental Clarity",
      value: Math.round(Math.min(100, 25 + p * 50 + b * 25)),
      color: "rgba(100, 175, 255, 0.85)",
      glow: "rgba(100, 175, 255, 0.35)",
    },
    {
      id: "nervous",
      label: "Nervous Reset",
      value: Math.round(Math.min(100, 30 + p * 45 + b * 25)),
      color: "rgba(100, 220, 170, 0.85)",
      glow: "rgba(100, 220, 170, 0.35)",
    },
    {
      id: "balance",
      label: "Emotional Balance",
      value: Math.round(Math.min(100, 20 + p * 50 + b * 30)),
      color: "rgba(185, 145, 255, 0.85)",
      glow: "rgba(185, 145, 255, 0.35)",
    },
    {
      id: "stress",
      label: "Stress Release",
      value: Math.round(Math.min(100, 15 + p * 55 + b * 30)),
      color: "rgba(240, 190, 90, 0.85)",
      glow: "rgba(240, 190, 90, 0.35)",
    },
    {
      id: "sleep",
      label: "Sleep Readiness",
      value: Math.round(Math.min(100, 10 + p * 50 + b * 40)),
      color: "rgba(120, 160, 255, 0.85)",
      glow: "rgba(120, 160, 255, 0.35)",
    },
  ];
}

interface RecoveryProgressProps {
  sessionSeconds: number;
  sessionDuration: number;
  sessionRunning: boolean;
  breathCycles: number;
  streak: number;
  className?: string;
}

export function RecoveryProgress({
  sessionSeconds,
  sessionDuration,
  sessionRunning,
  breathCycles,
  streak,
  className = "",
}: RecoveryProgressProps) {
  const elapsed = sessionDuration > 0 ? sessionDuration - sessionSeconds : 0;
  const dimensions = computeDimensions(elapsed, sessionDuration, breathCycles);
  const overallScore = Math.round(dimensions.reduce((a, d) => a + d.value, 0) / dimensions.length);

  return (
    <div className={`w-full flex flex-col gap-5 px-6 py-4 select-none ${className}`}>
      {/* ── Immersive Spatial Header ── */}
      <div className="flex items-center justify-between border-b border-white/[0.03] pb-3">
        <div>
          <span className="text-[0.56rem] font-semibold tracking-[0.32em] text-white/30 uppercase block mb-1">
            System Calibrations
          </span>
          <h3 className="text-[0.72rem] font-medium text-white/70 tracking-[0.02em]">
            Autonomic Restorations
          </h3>
        </div>

        {/* Global indicator status */}
        <div className="flex items-center gap-6">
          {streak > 0 && (
            <div className="text-right">
              <span className="text-[0.52rem] text-white/20 tracking-[0.16em] uppercase block mb-0.5">Sanctuary Streak</span>
              <span className="text-[0.78rem] font-medium text-amber-200/80 font-mono">{streak}d</span>
            </div>
          )}

          <div className="text-right border-l border-white/[0.04] pl-6 flex items-center gap-3">
            <div>
              <span className="text-[0.52rem] text-white/20 tracking-[0.16em] uppercase block mb-0.5">Integrity</span>
              <span className="text-[0.78rem] font-medium text-white/80 font-mono">{overallScore}%</span>
            </div>
            {/* Minimal halo pulsing dot */}
            <div className="relative w-2.5 h-2.5 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              {sessionRunning && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-white/20"
                  animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Minimal Vertical Bars HUD Grid ── */}
      <div className="grid grid-cols-5 gap-6">
        {dimensions.map((dim, i) => (
          <motion.div
            key={dim.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            {/* Sleek Vertical Capsule */}
            <div
              className="relative rounded-full bg-white/[0.02] border border-white/[0.03]"
              style={{
                width: "6px",
                height: "90px",
                overflow: "hidden",
              }}
            >
              {/* Internal rising light column */}
              <motion.div
                className="absolute bottom-0 inset-x-0 rounded-full"
                style={{
                  background: dim.color,
                  boxShadow: `0 0 12px ${dim.glow}`,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${dim.value}%` }}
                transition={{ duration: 1.8, ease: [0.25, 1.0, 0.5, 1.0] }}
              />
            </div>

            {/* Percentage Indicator */}
            <motion.span
              className="text-[0.62rem] font-medium text-white/50 font-mono mt-3 mb-1"
              animate={sessionRunning ? { opacity: [0.5, 0.85, 0.5] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            >
              {dim.value}%
            </motion.span>

            {/* Mini label below */}
            <span className="text-[0.52rem] font-medium text-white/25 tracking-[0.06em] text-center uppercase whitespace-nowrap">
              {dim.label.split(" ")[0]}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
