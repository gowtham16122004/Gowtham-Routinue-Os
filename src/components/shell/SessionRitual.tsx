/**
 * SessionRitual — Pre-session psychological preparation.
 * Creates intentional entry into deep focus state.
 * Mission definition → Breathing moment → Focus lock animation.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Target, Wind } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionType } from "@/lib/os-store";

interface Props {
  sessionType: SessionType;
  durationMins: number;
  onConfirm: (mission: string) => void;
  onDismiss: () => void;
}

const SESSION_PROMPTS: Record<SessionType, { title: string; placeholder: string; desc: string }> = {
  "deep-work":   { title: "Deep Work Session", placeholder: "e.g. Build the authentication system end-to-end.", desc: "Define the cognitive objective you will complete." },
  "learning":    { title: "Learning Block",    placeholder: "e.g. Master React Server Components architecture.", desc: "What knowledge structure will you build?" },
  "workout":     { title: "Physical Session",  placeholder: "e.g. 45-min strength training, legs focus.", desc: "Define your physical training intention." },
  "reflection":  { title: "Reflection Session",placeholder: "e.g. Process last week's key decisions and lessons.", desc: "What will you synthesize and integrate?" },
};

type Phase = "mission" | "breathing" | "locking";

export function SessionRitual({ sessionType, durationMins, onConfirm, onDismiss }: Props) {
  const [phase, setPhase]     = useState<Phase>("mission");
  const [mission, setMission] = useState("");
  const [breathCount, setBreathCount] = useState(0);
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prompt   = SESSION_PROMPTS[sessionType];

  useEffect(() => {
    if (phase === "mission") {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [phase]);

  // Breathing cycle: 4s in → 4s hold → 6s out
  useEffect(() => {
    if (phase !== "breathing") return;
    const cycle = [
      { phase: "in" as const,   ms: 4000 },
      { phase: "hold" as const, ms: 4000 },
      { phase: "out" as const,  ms: 6000 },
    ];
    let i = 0;
    const step = () => {
      setBreathPhase(cycle[i % cycle.length].phase);
      return cycle[i++ % cycle.length].ms;
    };
    let id: ReturnType<typeof setTimeout>;
    const run = () => {
      const ms = step();
      id = setTimeout(run, ms);
    };
    const startId = setTimeout(run, step());
    // After 3 breaths (42s) auto-advance — but we let user click too
    const autoId = setTimeout(() => {
      clearTimeout(startId); clearTimeout(id);
      setPhase("locking");
    }, 42000);
    return () => { clearTimeout(id); clearTimeout(autoId); };
  }, [phase]);

  // Locking phase — auto-confirm after 2.5s
  useEffect(() => {
    if (phase !== "locking") return;
    const id = setTimeout(() => onConfirm(mission), 2500);
    return () => clearTimeout(id);
  }, [phase, mission, onConfirm]);

  const handleStart = useCallback(() => {
    if (mission.trim().length < 3) return;
    setPhase("breathing");
  }, [mission]);

  const skipBreathing = useCallback(() => {
    setPhase("locking");
  }, []);

  const breathLabel = { in: "Breathe In", hold: "Hold", out: "Breathe Out" };
  const breathDuration = { in: 4, hold: 4, out: 6 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 45,
        background: "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(20,35,140,0.35), transparent 55%), rgba(3,4,14,0.97)",
        backdropFilter: "blur(28px)",
      }}
    >
      {/* Ambient light pulse */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 700, height: 700,
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(45,70,200,0.10) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <AnimatePresence mode="wait">

        {/* ── PHASE 1: Mission Definition ── */}
        {phase === "mission" && (
          <motion.div
            key="mission"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[480px] px-4"
          >
            <div className="rounded-3xl p-8" style={{
              background: "rgba(7,9,26,0.95)",
              border: "1px solid rgba(95,125,255,0.12)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.025) inset, 0 45px 120px rgba(0,0,0,0.85)",
            }}>
              {/* Header */}
              <div className="flex flex-col items-center text-center mb-8">
                <motion.div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "linear-gradient(135deg, rgba(48,80,215,0.35), rgba(35,60,185,0.25))", border: "1px solid rgba(95,135,255,0.22)", boxShadow: "0 0 42px rgba(65,105,255,0.20)" }}
                  animate={{ boxShadow: ["0 0 42px rgba(65,105,255,0.20)", "0 0 60px rgba(65,105,255,0.35)", "0 0 42px rgba(65,105,255,0.20)"] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Target className="h-6 w-6" style={{ color: "rgba(140,175,255,0.90)" }} />
                </motion.div>

                <div className="text-[10px] font-bold uppercase tracking-[0.35em] mb-2" style={{ color: "rgba(105,135,255,0.58)" }}>
                  Session Preparation
                </div>
                <h2 className="text-xl font-bold mb-1.5" style={{
                  background: "linear-gradient(135deg, #dce8ff, #8ca5e5)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  {prompt.title}
                </h2>
                <p className="text-[12px]" style={{ color: "rgba(148,168,220,0.50)" }}>
                  {prompt.desc}
                </p>
              </div>

              {/* Duration badge */}
              <div className="flex justify-center mb-6">
                <div className="px-4 py-1.5 rounded-full text-[11px] font-semibold" style={{
                  background: "rgba(50,72,195,0.14)", border: "1px solid rgba(95,130,255,0.18)",
                  color: "rgba(145,175,255,0.72)",
                }}>
                  {durationMins} minute session
                </div>
              </div>

              {/* Mission input */}
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-[0.28em] mb-2.5 block" style={{ color: "rgba(110,135,255,0.52)" }}>
                  Cognitive Objective
                </label>
                <textarea
                  ref={inputRef}
                  value={mission}
                  onChange={e => setMission(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && mission.trim().length >= 3) { e.preventDefault(); handleStart(); } }}
                  placeholder={prompt.placeholder}
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 resize-none outline-none text-[12.5px] leading-relaxed"
                  style={{
                    background: "rgba(255,255,255,0.030)",
                    border: "1px solid rgba(95,125,255,0.15)",
                    color: "rgba(198,215,255,0.88)",
                    caretColor: "rgba(110,148,255,0.82)",
                    fontFamily: "inherit",
                    transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "rgba(95,140,255,0.35)";
                    e.currentTarget.style.boxShadow = "0 0 24px rgba(70,110,255,0.10)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "rgba(95,125,255,0.15)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <p className="text-[10px] mt-1.5 text-right" style={{ color: "rgba(110,135,215,0.30)" }}>
                  Enter to begin
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onDismiss}
                  className="flex-1 py-3 rounded-2xl text-[12px] font-medium"
                  style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(148,168,218,0.45)",
                  }}
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleStart}
                  disabled={mission.trim().length < 3}
                  whileHover={mission.trim().length >= 3 ? { scale: 1.02, y: -1 } : {}}
                  whileTap={mission.trim().length >= 3 ? { scale: 0.97 } : {}}
                  className="flex-[2] py-3 rounded-2xl text-[13px] font-semibold"
                  style={{
                    background: mission.trim().length >= 3
                      ? "linear-gradient(135deg, rgba(62,95,220,0.62), rgba(45,76,195,0.52))"
                      : "rgba(45,65,180,0.20)",
                    border: mission.trim().length >= 3
                      ? "1px solid rgba(95,140,255,0.30)"
                      : "1px solid rgba(95,140,255,0.10)",
                    color: mission.trim().length >= 3 ? "rgba(208,222,255,0.95)" : "rgba(138,162,218,0.40)",
                    boxShadow: mission.trim().length >= 3 ? "0 0 28px rgba(70,108,255,0.20)" : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  Enter Focus State
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PHASE 2: Breathing ── */}
        {phase === "breathing" && (
          <motion.div
            key="breathing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.35em] mb-8" style={{ color: "rgba(105,135,255,0.48)" }}>
              Prepare Your Mind
            </div>

            {/* Breathing orb */}
            <div className="relative flex items-center justify-center mb-12" style={{ width: 200, height: 200 }}>
              <motion.div
                className="absolute rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(60,95,230,0.35) 0%, rgba(40,70,190,0.15) 60%, transparent 100%)",
                  filter: "blur(20px)",
                }}
                animate={
                  breathPhase === "in"   ? { width: 200, height: 200, opacity: 0.9 } :
                  breathPhase === "hold" ? { width: 200, height: 200, opacity: 1 } :
                                           { width: 120, height: 120, opacity: 0.5 }
                }
                transition={{ duration: breathDuration[breathPhase], ease: "easeInOut" }}
              />
              <motion.div
                className="rounded-full flex items-center justify-center"
                style={{ background: "rgba(35,55,190,0.22)", border: "1px solid rgba(90,130,255,0.25)" }}
                animate={
                  breathPhase === "in"   ? { width: 140, height: 140 } :
                  breathPhase === "hold" ? { width: 140, height: 140 } :
                                           { width: 90, height: 90 }
                }
                transition={{ duration: breathDuration[breathPhase], ease: "easeInOut" }}
              >
                <Wind className="h-7 w-7" style={{ color: "rgba(140,175,255,0.70)" }} />
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={breathPhase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="text-2xl font-light mb-3"
                style={{ color: "rgba(195,215,255,0.80)" }}
              >
                {breathLabel[breathPhase]}
              </motion.div>
            </AnimatePresence>

            <p className="text-[11.5px] mb-10" style={{ color: "rgba(135,158,218,0.40)" }}>
              Prepare your nervous system for sustained concentration.
            </p>

            <button
              onClick={skipBreathing}
              className="text-[11px] px-5 py-2 rounded-full"
              style={{
                color: "rgba(135,158,218,0.38)",
                border: "1px solid rgba(95,120,255,0.10)",
                background: "rgba(255,255,255,0.025)",
              }}
            >
              Skip → Enter Focus
            </button>
          </motion.div>
        )}

        {/* ── PHASE 3: Locking ── */}
        {phase === "locking" && (
          <motion.div
            key="locking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              className="h-20 w-20 rounded-full flex items-center justify-center mb-8"
              style={{
                background: "linear-gradient(135deg, rgba(45,75,215,0.40), rgba(30,55,185,0.30))",
                border: "1px solid rgba(95,140,255,0.28)",
              }}
              animate={{
                boxShadow: ["0 0 40px rgba(65,105,255,0.25)", "0 0 75px rgba(65,105,255,0.50)", "0 0 40px rgba(65,105,255,0.25)"],
              }}
              transition={{ duration: 1.5, repeat: 1 }}
            >
              <Brain className="h-9 w-9" style={{ color: "rgba(140,175,255,0.90)" }} />
            </motion.div>

            <motion.div
              className="text-[11px] font-bold uppercase tracking-[0.35em] mb-3"
              style={{ color: "rgba(110,145,255,0.60)" }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              Entering Protected Focus State
            </motion.div>

            <motion.p
              className="text-[13px] max-w-[260px] leading-relaxed"
              style={{ color: "rgba(165,185,228,0.55)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Environment stabilizing. Cognitive architecture loading.
            </motion.p>

            {mission.trim() && (
              <motion.div
                className="mt-8 px-5 py-3 rounded-2xl max-w-[320px]"
                style={{ background: "rgba(45,65,192,0.10)", border: "1px solid rgba(90,120,255,0.12)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-[9px] font-bold uppercase tracking-[0.28em] mb-1.5" style={{ color: "rgba(105,135,255,0.45)" }}>
                  Mission Locked
                </div>
                <p className="text-[11.5px] leading-snug italic" style={{ color: "rgba(185,205,255,0.65)" }}>
                  "{mission}"
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
