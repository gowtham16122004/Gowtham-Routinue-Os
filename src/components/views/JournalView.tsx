import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getMonthInfo } from "@/lib/habits";
import { useOS } from "@/lib/os-store";

export function JournalView() {
  const { data, setData } = useOS();
  const info = useMemo(() => getMonthInfo(), []);
  const [selected, setSelected] = useState<number>(new Date().getDate());

  const meta = data.meta[selected] ?? {};
  const setNote = (note: string) => setData({ ...data, meta: { ...data.meta, [selected]: { ...meta, note } } });

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Journal</div>
        <h2 className="mt-1 font-display text-3xl tracking-tight">{info.monthName} {info.year}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Capture daily reflections — they feed the AI's behavioral memory.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="glass rounded-2xl p-3 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {info.days.map(d => {
            const has = !!data.meta[d.day]?.note?.trim();
            return (
              <button key={d.day} onClick={() => setSelected(d.day)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] transition-colors ${
                  selected === d.day ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-white/[0.04]"
                }`}>
                <span><b className="font-mono">{String(d.day).padStart(2,"0")}</b> · {d.weekday}</span>
                {has && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
        <motion.div key={selected} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Day {selected}</div>
          <textarea
            value={meta.note ?? ""}
            onChange={(e) => setNote(e.target.value)}
            rows={18}
            placeholder="Reflect on today…"
            className="mt-2 w-full resize-none rounded-md bg-white/[0.02] ring-1 ring-border/40 px-3 py-2 text-[13.5px] text-foreground outline-none focus:ring-primary/40 placeholder:text-muted-foreground/60"
          />
        </motion.div>
      </div>
    </div>
  );
}
