import { useState } from "react";
import { motion, Reorder } from "framer-motion";
import { GripVertical, Plus, Trash2, RotateCcw } from "lucide-react";
import { useOS } from "@/lib/os-store";
import { DEFAULT_HABITS, type Habit, type HabitCategory } from "@/lib/habits";

const CATS: HabitCategory[] = ["wellness", "learning", "work", "fitness", "leisure"];

export function SettingsView() {
  const { habits, setHabits, mode, setMode } = useOS();
  const [draft, setDraft] = useState({ time: "", label: "", category: "work" as HabitCategory });

  const add = () => {
    if (!draft.label.trim()) return;
    const id = draft.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) + "-" + Math.random().toString(36).slice(2, 6);
    setHabits([...habits, { id, time: draft.time || "—", label: draft.label.trim(), category: draft.category }]);
    setDraft({ time: "", label: "", category: "work" });
  };
  const remove = (id: string) => setHabits(habits.filter(h => h.id !== id));
  const update = (id: string, patch: Partial<Habit>) =>
    setHabits(habits.map(h => h.id === id ? { ...h, ...patch } : h));
  const resetDefaults = () => setHabits(DEFAULT_HABITS);

  return (
    <div className="space-y-5">
      <div className="glass relative overflow-hidden rounded-2xl p-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Settings</div>
        <h2 className="mt-1 font-display text-3xl tracking-tight">Configure your operating system</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">Edit routines, reorder blocks, tune operating modes. Everything saves locally to your device — no account required.</p>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Operating Mode</div>
            <p className="text-sm text-foreground/90">Pick the active behavior pattern.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["operator","deep","recovery"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-xl px-4 py-2.5 text-[12px] font-medium capitalize ring-1 transition-colors ${
                mode === m ? "bg-primary/15 ring-primary/40 text-foreground" : "ring-border/50 text-muted-foreground hover:bg-white/[0.04]"
              }`}>
              {m} mode
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Routines</div>
            <p className="text-sm text-foreground/90">Drag to reorder · edit inline · {habits.length} habits</p>
          </div>
          <button onClick={resetDefaults}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] ring-1 ring-border/50 text-muted-foreground hover:bg-white/[0.04]">
            <RotateCcw className="h-3 w-3" /> Reset defaults
          </button>
        </div>

        <Reorder.Group axis="y" values={habits} onReorder={setHabits} className="space-y-1.5">
          {habits.map(h => (
            <Reorder.Item key={h.id} value={h}
              className="flex items-center gap-2 rounded-xl bg-white/[0.02] ring-1 ring-border/40 px-2 py-1.5">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
              <input value={h.time} onChange={(e) => update(h.id, { time: e.target.value })}
                className="w-[140px] bg-transparent text-[11px] font-mono text-muted-foreground outline-none focus:text-foreground" />
              <input value={h.label} onChange={(e) => update(h.id, { label: e.target.value })}
                className="flex-1 bg-transparent text-[13px] text-foreground outline-none" />
              <select value={h.category} onChange={(e) => update(h.id, { category: e.target.value as HabitCategory })}
                className="bg-transparent text-[11px] text-muted-foreground outline-none">
                {CATS.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
              </select>
              <button onClick={() => remove(h.id)} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-3 flex items-center gap-2 rounded-xl bg-primary/[0.04] ring-1 ring-primary/20 px-2 py-1.5">
          <Plus className="h-4 w-4 text-primary" />
          <input value={draft.time} onChange={(e) => setDraft(d => ({...d, time: e.target.value}))}
            placeholder="6:00 – 7:00 AM"
            className="w-[140px] bg-transparent text-[11px] font-mono text-muted-foreground outline-none placeholder:text-muted-foreground/50" />
          <input value={draft.label} onChange={(e) => setDraft(d => ({...d, label: e.target.value}))}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New routine name"
            className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50" />
          <select value={draft.category} onChange={(e) => setDraft(d => ({...d, category: e.target.value as HabitCategory}))}
            className="bg-transparent text-[11px] text-muted-foreground outline-none">
            {CATS.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
          </select>
          <button onClick={add}
            className="rounded-md bg-primary/15 ring-1 ring-primary/40 px-3 py-1 text-[11px] font-medium text-foreground hover:bg-primary/25">Add</button>
        </motion.div>
      </div>
    </div>
  );
}
