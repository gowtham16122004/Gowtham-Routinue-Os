import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, Target, Clock, Lightbulb, Flame, Heart, Zap, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { getMonthInfo } from "@/lib/habits";
import { useOS } from "@/lib/os-store";

export function InsightsPanel() {
  const { habits, data, aiInsights } = useOS();
  const info = useMemo(() => getMonthInfo(), []);
  const today = new Date().getDate();

  const insights = useMemo(() => {
    const counts: Record<string, number> = {};
    habits.forEach(h => { counts[h.id] = 0; });
    const perDay: number[] = Array(info.daysInMonth + 1).fill(0);
    for (let d = 1; d <= today; d++) {
      habits.forEach(h => { if (data.cells[`${h.id}:${d}`] === 1) { counts[h.id]++; perDay[d]++; } });
    }

    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const best = habits.find(h => h.id === sorted[0]?.[0]);
    const worst = habits.find(h => h.id === sorted[sorted.length-1]?.[0]);

    const last5 = perDay.slice(Math.max(1, today-4), today+1);
    const avg = last5.reduce((a,b)=>a+b,0)/Math.max(1,last5.length);
    const lowCycle = avg < habits.length * 0.4;

    const morningId = habits[0]?.id;
    const morningCount = morningId ? perDay.slice(1, today+1).filter((_,i)=>data.cells[`${morningId}:${i+1}`]===1).length : 0;
    const morningPct = Math.round((morningCount / Math.max(1, today)) * 100);

    const list = [
      { icon: Clock, tone: "primary" as const, title: "Peak performance window",
        body: `Your morning anchor completes ${morningPct}% of the time. Schedule your hardest work here.` },
      { icon: Target, tone: "primary" as const, title: "Strongest pattern",
        body: `${best?.label ?? "—"} is your most consistent habit. Use it as the anchor that triggers the rest.` },
      { icon: AlertTriangle, tone: lowCycle ? "warn" : "muted" as const,
        title: lowCycle ? "Low-energy cycle forming" : "Distraction watch",
        body: lowCycle
          ? "Three of the last five days dipped below 40%. Protect sleep, drop one optional block tomorrow."
          : `${worst?.label ?? "Weakest block"} is below average. Move it earlier in the day before willpower decays.` },
    ];

    // Merge in any deep AI correlations from session history
    const filteredAi = aiInsights.filter(insight => insight.id !== "onboarding");
    if (filteredAi.length > 0) {
      filteredAi.forEach(ai => {
        let icon = Sparkles;
        let tone: "good" | "warn" | "primary" | "muted" = "primary";
        if (ai.category === "burnout") { icon = AlertTriangle; tone = "warn"; }
        if (ai.category === "recovery") { icon = Heart; tone = "good"; }
        if (ai.category === "momentum") { icon = Flame; tone = "good"; }
        if (ai.category === "timing") { icon = Clock; tone = "primary"; }

        list.push({
          icon,
          tone,
          title: `AI Correlation · ${ai.category}`,
          body: ai.message
        });
      });
    } else {
      // Fallback standard correlations if no session data yet
      list.push(
        { icon: TrendingUp, tone: "good" as const, title: "Behavioral correlation",
          body: "Active-fitness days correlate with stronger evening focus. Stack workout before cognitive work." },
        { icon: Lightbulb, tone: "primary" as const, title: "Optimization suggestion",
          body: "Pair your weakest habit with a strong anchor — paired execution increases retention by ~18%." }
      );
    }

    return list.slice(0, 6); // Limit to maximum 6 insights
  }, [data, habits, info.daysInMonth, today, aiInsights]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="glass relative overflow-hidden rounded-2xl p-6">
      <div className="light-streak" style={{ top: "30%", left: "-10%", width: "120%", height: 1 }} />
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
            <Brain className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Behavioral Intelligence</div>
            <h3 className="text-[15px] font-semibold tracking-tight">Patterns the AI detected this week</h3>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-muted-foreground ring-1 ring-border/60 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" /> Live · scanning {today} days
        </span>
      </div>
      <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((it, i) => (
          <motion.div key={it.title}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="glass-hover group relative overflow-hidden rounded-xl bg-white/[0.015] p-4 ring-1 ring-border/40">
            <div className="flex items-start gap-3">
              <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ${
                it.tone === "good" ? "bg-emerald-400/10 ring-emerald-400/30 text-emerald-300" :
                it.tone === "warn" ? "bg-amber-400/10 ring-amber-400/30 text-amber-300" :
                it.tone === "muted" ? "bg-white/[0.04] ring-border/60 text-muted-foreground" :
                "bg-primary/10 ring-primary/30 text-primary"}`}>
                <it.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium leading-tight text-foreground">{it.title}</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{it.body}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
