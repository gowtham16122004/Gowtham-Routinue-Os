import { motion } from "framer-motion";
import { Check, Minus, Smile, Meh, Moon as MoonIcon, X } from "lucide-react";
import { useOS } from "@/lib/os-store";
import type { CellState, Mood } from "@/lib/habits";

const STATE_CYCLE: CellState[] = [0, 1, 2, 3];

export function DailyOSView() {
  const { habits, data, setData } = useOS();
  const today = new Date().getDate();
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const toggle = (id: string) => {
    const key = `${id}:${today}`;
    const current = data.cells[key] ?? 0;
    const next = STATE_CYCLE[(STATE_CYCLE.indexOf(current) + 1) % STATE_CYCLE.length];
    const cells = { ...data.cells };
    if (next === 0) delete cells[key]; else cells[key] = next;
    setData({ ...data, cells });
  };
  const setMood = (mood: Mood) => setData({ ...data, meta: { ...data.meta, [today]: { ...data.meta[today], mood } } });
  const setNote = (note: string) => setData({ ...data, meta: { ...data.meta, [today]: { ...data.meta[today], note } } });

  const done = habits.filter(h => data.cells[`${h.id}:${today}`] === 1).length;
  const pct = Math.round((done / Math.max(1, habits.length)) * 100);
  const mood = data.meta[today]?.mood ?? null;
  const note = data.meta[today]?.note ?? "";

  return (
    <div className="space-y-5">
      <div className="glass relative overflow-hidden rounded-2xl p-6">
        <div className="fog" style={{ top: -120, right: -100, width: 360, height: 360 }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary">Daily OS</div>
            <h2 className="mt-1 font-display text-3xl tracking-tight">{dateLabel}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Discipline Alignment: {pct}% · {done}/{habits.length} routines ticked</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Mood:</span>
            {([["great", Smile, "text-emerald-300"], ["ok", Meh, "text-amber-300"], ["low", MoonIcon, "text-indigo-300"]] as const).map(([m, I, c]) => (
              <button key={m} onClick={() => setMood(mood === m ? null : m as Mood)}
                className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ${mood === m ? "bg-primary/15 ring-primary/40" : "ring-border/50 hover:bg-white/[0.04]"}`}>
                <I className={`h-4 w-4 ${c}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/40" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass relative overflow-hidden rounded-2xl p-5 lg:col-span-2">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Today's blocks</div>
          <ul className="space-y-1.5">
            {habits.map((h, i) => {
              const state = data.cells[`${h.id}:${today}`] ?? 0;
              return (
                <motion.li key={h.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <button onClick={() => toggle(h.id)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-border/40 bg-white/[0.015] hover:bg-white/[0.04] transition-colors">
                    <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ring-1 ${
                      state === 1 ? "bg-emerald-500/15 ring-emerald-400/40 text-emerald-300"
                      : state === 2 ? "bg-amber-500/15 ring-amber-400/40 text-amber-300"
                      : state === 3 ? "bg-rose-500/15 ring-rose-400/40 text-rose-300"
                      : "bg-white/[0.03] ring-border/50 text-muted-foreground"}`}>
                      {state === 1 ? <Check className="h-3.5 w-3.5" strokeWidth={3}/>
                      : state === 2 ? <Minus className="h-3.5 w-3.5" strokeWidth={3}/>
                      : state === 3 ? <X className="h-3.5 w-3.5" strokeWidth={3}/>
                      : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className={`text-[13px] font-medium ${state === 1 ? "line-through opacity-60" : "text-foreground"}`}>{h.label}</div>
                      <div className="text-[10.5px] font-mono text-muted-foreground">{h.time}</div>
                    </div>
                    <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground/70">{h.category}</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="glass relative overflow-hidden rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Reflection</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What worked today? What didn't?"
            rows={10}
            className="w-full resize-none rounded-md bg-white/[0.02] ring-1 ring-border/40 px-3 py-2 text-[13px] text-foreground outline-none focus:ring-primary/40 placeholder:text-muted-foreground/60"
          />
          <p className="mt-2 text-[10.5px] text-muted-foreground">Saved automatically for {dateLabel.split(",")[0]}.</p>
        </div>
      </div>
    </div>
  );
}
