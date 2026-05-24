import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface RecoveryMetric {
  id: string;
  label: string;
  value: number;   // 0–100
  trend: "decreasing" | "restoring" | "stabilising" | "rebuilding";
  color: string;
}

function getRecoveryMetrics(sessionSeconds: number, sessionDuration: number, breathCycles: number): RecoveryMetric[] {
  const elapsed  = sessionDuration > 0 ? sessionDuration - sessionSeconds : 0;
  const progress = sessionDuration > 0 ? Math.min(1.0, elapsed / sessionDuration) : 0;
  const breath   = Math.min(1.0, breathCycles / 8);

  return [
    {
      id: "mental-load",
      label: "Cognitive Fatigue",
      value: Math.round(Math.max(8, 85 - progress * 50 - breath * 15)),
      trend: "decreasing",
      color: "rgba(180, 160, 255, 0.8)",
    },
    {
      id: "stress-level",
      label: "Cortisol Level",
      value: Math.round(Math.max(5, 78 - progress * 55 - breath * 12)),
      trend: "decreasing",
      color: "rgba(100, 180, 240, 0.8)",
    },
    {
      id: "nervous-system",
      label: "Parasympathetic Tone",
      value: Math.round(Math.min(100, 30 + progress * 45 + breath * 25)),
      trend: "restoring",
      color: "rgba(100, 220, 160, 0.8)",
    },
    {
      id: "hrv-index",
      label: "HRV Coherence",
      value: Math.round(Math.min(100, 35 + progress * 40 + breath * 25)),
      trend: "stabilising",
      color: "rgba(240, 190, 90, 0.8)",
    },
  ];
}

interface RecoveryInsightsProps {
  sessionSeconds: number;
  sessionDuration: number;
  sessionRunning: boolean;
  breathCycles: number;
  className?: string;
}

export function RecoveryInsights({
  sessionSeconds,
  sessionDuration,
  sessionRunning,
  breathCycles,
  className = "",
}: RecoveryInsightsProps) {
  const [metrics, setMetrics] = useState<RecoveryMetric[]>(() =>
    getRecoveryMetrics(sessionSeconds, sessionDuration, breathCycles)
  );

  // Update metrics dynamically every second to create live immersion
  useEffect(() => {
    const update = () => {
      setMetrics(getRecoveryMetrics(sessionSeconds, sessionDuration, breathCycles));
    };
    update();
    if (!sessionRunning) return;
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [sessionRunning, sessionSeconds, sessionDuration, breathCycles]);

  return (
    <div className={`w-full flex flex-col gap-4 select-none ${className}`}>
      {/* ── Immersive Header ── */}
      <div className="border-b border-white/[0.03] pb-3 mb-1">
        <span className="text-[0.56rem] font-semibold tracking-[0.32em] text-white/30 uppercase block mb-1">
          Biometric Stream
        </span>
        <h3 className="text-[0.72rem] font-medium text-white/70 tracking-[0.02em]">
          Cognitive Load Telemetry
        </h3>
      </div>

      {/* ── Live Calibration List ── */}
      <div className="flex flex-col gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.6 }}
          >
            {/* Header info */}
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[0.62rem] font-medium text-white/50 tracking-[0.02em]">
                {m.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[0.5rem] font-semibold tracking-[0.08em] text-white/20 uppercase">
                  {m.trend}
                </span>
                <span className="text-[0.62rem] font-medium font-mono text-white/70 min-w-[1.6rem] text-right">
                  {m.value}%
                </span>
              </div>
            </div>

            {/* Ultra-sleek single-pixel visual bar */}
            <div className="h-[2px] rounded-full bg-white/[0.02] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: m.color,
                  boxShadow: `0 0 8px ${m.color}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${m.value}%` }}
                transition={{ duration: 1.0, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Poetic Micro-Coaching Message ── */}
      <div className="mt-4 pt-3 border-t border-white/[0.03]">
        <InsightMessage sessionRunning={sessionRunning} progress={breathCycles} />
      </div>
    </div>
  );
}

const COACHING_MESSAGES = [
  "Nervous regulation active. Relinquishing cortisol...",
  "Inhales are expanding parasympathetic receptor volume...",
  "Exhaling slowly stimulates vagal tone optimization...",
  "Neural coherence stabilizes. Alpha brainwave waves rising...",
  "Dissipating muscle defense patterns. Shoulders letting go...",
  "Stillness recalibrates focus capacity. Calm returns...",
  "Deep breath stack complete. Cellular recovery accelerating...",
];

function InsightMessage({ sessionRunning, progress }: { sessionRunning: boolean; progress: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!sessionRunning) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % COACHING_MESSAGES.length);
    }, 8500);
    return () => clearInterval(id);
  }, [sessionRunning]);

  const activeMsg = sessionRunning ? COACHING_MESSAGES[index] : "Sanctuary is online. Awaiting system activation.";

  return (
    <div className="h-6 flex items-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={activeMsg}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 0.45, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="text-[0.58rem] font-medium leading-relaxed text-white/70 italic tracking-[0.02em] m-0"
        >
          {activeMsg}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
