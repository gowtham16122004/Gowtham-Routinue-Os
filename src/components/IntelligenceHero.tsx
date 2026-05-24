import { motion } from "framer-motion";
import { useMemo } from "react";
import { Brain, TrendingUp, TrendingDown, Zap, Sun, ShieldCheck, Sparkles } from "lucide-react";
import { getMonthInfo } from "@/lib/habits";
import { AnimatedCounter, Sparkline, CircularProgress } from "@/components/ui/data-viz";
import { cn } from "@/lib/utils";
import { useOS } from "@/lib/os-store";

export function IntelligenceHero() {
  const { habits, data, mode } = useOS();
  const info = useMemo(() => getMonthInfo(), []);
  const today = new Date().getDate();

  const m = useMemo(() => {
    const perDay: number[] = Array(info.daysInMonth + 1).fill(0);
    let done = 0;
    habits.forEach((h) => {
      for (let d = 1; d <= info.daysInMonth; d++) {
        if (data.cells[`${h.id}:${d}`] === 1) { done++; perDay[d]++; }
      }
    });
    const total = Math.max(1, habits.length * info.daysInMonth);
    const completion = Math.round((done / total) * 100);

    const threshold = Math.ceil(habits.length * 0.7);
    let streak = 0, run = 0;
    for (let d = 1; d <= today; d++) {
      if (perDay[d] >= threshold) { run++; streak = run; } else run = 0;
    }

    const last7 = perDay.slice(Math.max(1, today - 6), today + 1).reduce((a,b)=>a+b,0);
    const prev7 = perDay.slice(Math.max(1, today - 13), Math.max(1, today - 6)).reduce((a,b)=>a+b,0);
    const momentum = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7)/prev7)*100);

    const morningIds = habits.slice(0, Math.ceil(habits.length / 3)).map(h => h.id);
    const eveningIds = habits.slice(-Math.ceil(habits.length / 3)).map(h => h.id);
    const morning = morningIds.reduce((acc,id) => {
      let c=0; for (let d=1; d<=today; d++) if (data.cells[`${id}:${d}`]===1) c++; return acc+c;
    }, 0);
    const evening = eveningIds.reduce((acc,id) => {
      let c=0; for (let d=1; d<=today; d++) if (data.cells[`${id}:${d}`]===1) c++; return acc+c;
    }, 0);
    const peakWindow = morning >= evening ? "7–10 AM" : "6–9 PM";

    const discipline = Math.min(100, Math.round(completion * 0.55 + Math.min(streak, 14)/14 * 45));
    const focus = Math.min(100, Math.round((last7 / Math.max(1, habits.length*7)) * 100));
    
    // Custom neural loads and burnout risk parameters
    const burnoutRisk = momentum < -25 ? "Elevated" : focus > 85 ? "Low" : "Moderate";
    const energy = focus > 70 ? "Optimal Capacity" : focus > 40 ? "Steady State" : "Recharging";

    return { completion, streak, momentum, peakWindow, discipline, focus, burnoutRisk, energy, spark: perDay.slice(1, today + 1) };
  }, [data, habits, info.daysInMonth, today]);

  // Adjust briefing text depending on recovery/operator mode
  const currentBriefingTitle = useMemo(() => {
    if (mode === "recovery") {
      return "Recovery protocol active. Prioritizing rest and cognitive restoration.";
    }
    return buildBriefing(m);
  }, [mode, m]);

  const currentBriefingDesc = useMemo(() => {
    if (mode === "recovery") {
      return `Burnout probability has decreased since starting recovery protocols. Focus integrity is at ${m.completion}%. Stick to lighter scheduling today.`;
    }
    return buildSubBriefing(m);
  }, [mode, m]);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative col-span-12 overflow-hidden rounded-2xl p-6 lg:col-span-7 border border-border/40">
        <div className="light-streak" style={{ top: "20%", left: "-20%", width: "140%", height: 1 }} />
        <div className="fog" style={{ top: -120, right: -120, width: 360, height: 360 }} />
        <div className="relative flex items-start gap-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30 breathe">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-primary pulse-dot" />
              AI Briefing · {new Date().toLocaleDateString("en-US",{weekday:"long"})}
            </div>
            <h2 className="mt-2 font-display text-[24px] leading-tight tracking-tight md:text-[28px] text-foreground">
              {currentBriefingTitle}
            </h2>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              {currentBriefingDesc}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Chip icon={Sun} label={`Peak Focus · ${m.peakWindow}`} />
              <Chip icon={ShieldCheck} label={`Neural Load · ${m.burnoutRisk}`} />
              <Chip icon={Zap} label={`Energy battery · ${m.energy}`} />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="glass relative col-span-12 overflow-hidden rounded-2xl p-6 sm:col-span-6 lg:col-span-3 border border-border/40">
        <div className="fog" style={{ top: -80, left: -60, width: 240, height: 240 }} />
        <div className="relative flex items-center justify-between">
          <div className="text-[9px] uppercase font-bold tracking-[0.18em] text-muted-foreground">Discipline Index</div>
          <Sparkles className="h-3.5 w-3.5 text-primary/70 animate-pulse" />
        </div>
        <div className="relative mt-4 flex items-center gap-4">
          <CircularProgress value={m.discipline} size={84} stroke={6}>
            <div className="text-center">
              <div className="font-display text-lg font-bold leading-none">
                <AnimatedCounter value={m.discipline} />
              </div>
              <div className="mt-0.5 text-[8px] uppercase tracking-wider text-muted-foreground">Index</div>
            </div>
          </CircularProgress>
          <div className="flex-1">
            <Row label="Focus integrity" value={`${m.focus}%`} />
            <Row label="Momentum" value={`${m.streak}d`} />
            <Row label="Stability" value={`${m.momentum >= 0 ? "+" : ""}${m.momentum}%`} tone={m.momentum >= 0 ? "up" : "down"} />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="glass relative col-span-12 overflow-hidden rounded-2xl p-6 sm:col-span-6 lg:col-span-2 border border-border/40">
        <div className="relative flex items-center justify-between">
          <div className="text-[9px] uppercase font-bold tracking-[0.18em] text-muted-foreground">Momentum Velocity</div>
          <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
            m.momentum >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300")}>
            {m.momentum >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {Math.abs(m.momentum)}%
          </span>
        </div>
        <div className="relative mt-3 font-display text-2xl font-semibold leading-none tracking-tight">
          <AnimatedCounter value={m.completion} suffix="%" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{info.monthName} completion</p>
        <div className="relative mt-3 -mx-2">
          <Sparkline values={m.spark.length ? m.spark : [0,0]} width={180} height={42} color="var(--primary)" />
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex items-center justify-between py-1 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono font-medium",
        tone === "up" && "text-emerald-300",
        tone === "down" && "text-rose-300",
        !tone && "text-foreground/90")}>{value}</span>
    </div>
  );
}

function Chip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10.5px] text-foreground/80 ring-1 ring-border/50">
      <Icon className="h-3 w-3 text-primary/80" /> {label}
    </span>
  );
}

function buildBriefing(m: { completion: number; streak: number; momentum: number; peakWindow: string }) {
  if (m.completion === 0) return "Begin today. One tick starts the curve.";
  if (m.streak >= 5) return `Momentum velocity high. Protect the active ${m.streak}-day streak path.`;
  if (m.momentum > 20) return `Momentum Velocity is compounding. Start your next ${m.peakWindow} focus session.`;
  if (m.momentum < -20) return "Momentum dip detected. Stacking morning anchor blocks resets the curve.";
  return `Focus Integrity is at ${m.completion}% this month. Push one more session to break average.`;
}
function buildSubBriefing(m: { peakWindow: string; energy: string; burnoutRisk: string }) {
  return `Peak performance window detected at ${m.peakWindow}. Energy capacity is ${m.energy.toLowerCase()}, neural load is balanced. AI is monitoring distraction patterns.`;
}
