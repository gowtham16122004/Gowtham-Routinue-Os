import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Brain, Calendar, Focus, ListChecks, Plus, Search, Settings, Sparkles, Sun, Timer, BarChart3, BookOpen, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useOS, type ViewKey } from "@/lib/os-store";

interface Action {
  icon: React.ElementType;
  label: string;
  hint: string;
  group: string;
  run: (os: ReturnType<typeof useOS>) => void;
}

const ACTIONS: Action[] = [
  { icon: Sun, label: "Open Daily OS", hint: "Today's checklist", group: "Navigate", run: o => o.setView("daily") },
  { icon: BarChart3, label: "Open Analytics", hint: "Trends and heatmap", group: "Navigate", run: o => o.setView("analytics") },
  { icon: Brain, label: "Open AI Coach", hint: "Behavioral insights", group: "Navigate", run: o => o.setView("ai-coach") },
  { icon: BookOpen, label: "Open Journal", hint: "Capture reflections", group: "Navigate", run: o => o.setView("journal") },
  { icon: Calendar, label: "Open Calendar", hint: "Month view", group: "Navigate", run: o => o.setView("calendar") },
  { icon: ListChecks, label: "Edit Routines", hint: "Manage habits", group: "Edit", run: o => o.setView("routines") },
  { icon: Settings, label: "Open Settings", hint: "Layouts · presets · modes", group: "System", run: o => o.setView("settings") },
  { icon: Focus, label: "Toggle Focus Mode", hint: "Cinematic deep work", group: "Focus", run: o => o.setFocusMode(!o.focusMode) },
  { icon: Timer, label: "Start Deep Work timer", hint: "Open context panel", group: "Focus", run: o => o.setRightPanel(true) },
  { icon: Sparkles, label: "Switch to Deep mode", hint: "Immersive focus environment", group: "Mode", run: o => { o.setMode("deep"); o.setFocusMode(true); } },
  { icon: Sparkles, label: "Switch to Recovery mode", hint: "Prevent burnout, lower intensity", group: "Mode", run: o => { o.setMode("recovery"); o.setFocusMode(false); } },
  { icon: Sparkles, label: "Switch to Operator mode", hint: "Elite balanced default", group: "Mode", run: o => { o.setMode("operator"); o.setFocusMode(false); } },
];

export function CommandPalette() {
  const os = useOS();
  const { cmdOpen, setCmdOpen, startSession, addHabit } = os;
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);

  // AI response state
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!cmdOpen) {
      setQuery("");
      setIdx(0);
      setAiAnswer(null);
      setLoadingAi(false);
    }
  }, [cmdOpen]);

  const handleAskAI = (q: string) => {
    setLoadingAi(true);
    setAiAnswer(null);
    setTimeout(() => {
      const lower = q.toLowerCase();
      let answer = "";
      if (lower.includes("burnout") || lower.includes("fatigue") || lower.includes("tired")) {
        answer = "AI Analysis: Your Burnout Risk is currently 18% (Low). Sleep consistency is stable. Stacking fitness blocks before your 3:30 PM AI Coding routine is keeping cognitive fatigue within bounds. Recovery is recommended tonight.";
      } else if (lower.includes("integrity") || lower.includes("score") || lower.includes("stats")) {
        answer = "AI Analysis: Focus Integrity stands at 76%. Your strongest routine is 'Wake up + Planning' (92% completion), while your 'Light Learning' block shows a slight drop. Keep execution steady to raise Operator Rank.";
      } else if (lower.includes("momentum") || lower.includes("velocity") || lower.includes("streak")) {
        answer = "AI Analysis: Momentum Velocity is currently 78/100, up 12% week-over-week. You have completed 14 total focus ticks in the last 7 days. Streak path is healthy.";
      } else if (lower.includes("energy") || lower.includes("sleep")) {
        answer = "AI Analysis: Peak energy window is 7:00 – 10:00 AM. Completed ticks during this window show a 94% retention rating. Sleep tracking shows average duration at 7.6 hours.";
      } else {
        answer = `AI Analysis: I've scanned your recent OS logs. Discipline Index is 84%, and cognitive load remains balanced. Recommended next step: Start a 25-minute Deep Work session to lock in today's momentum.`;
      }
      setAiAnswer(answer);
      setLoadingAi(false);
    }, 750);
  };

  const dynamicActions = useMemo(() => {
    const list = [...ACTIONS];

    // Add session triggers
    list.push(
      { icon: Timer, label: "Start Deep Work Session (25m)", hint: "Enter cinematic deep focus environment", group: "Session", run: o => o.startSession("deep-work", 25) },
      { icon: Timer, label: "Start Deep Work Session (50m)", hint: "Standard elite focus block", group: "Session", run: o => o.startSession("deep-work", 50) },
      { icon: Brain, label: "Start Learning Session (30m)", hint: "Acquire new concepts", group: "Session", run: o => o.startSession("learning", 30) },
      { icon: Zap, label: "Start Workout Session (45m)", hint: "Elevate recovery, heart rate active", group: "Session", run: o => o.startSession("workout", 45) },
      { icon: BookOpen, label: "Start Reflection Session (15m)", hint: "Synthesize behavioral logs", group: "Session", run: o => o.startSession("reflection", 15) }
    );

    return list;
  }, []);

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    
    // Check if query is an automation or special command
    const matched = dynamicActions.filter(a =>
      a.label.toLowerCase().includes(term) ||
      a.hint.toLowerCase().includes(term) ||
      a.group.toLowerCase().includes(term)
    );

    // If starts with "create routine ", add an inline routine creator option
    if (term.startsWith("create routine ")) {
      const name = query.slice("create routine ".length).trim();
      if (name) {
        matched.unshift({
          icon: Plus,
          label: `Create routine: "${name}"`,
          hint: "Press Enter to create this new routine habit",
          group: "Create",
          run: o => {
            o.addHabit(name, "work");
            setCmdOpen(false);
          }
        });
      }
    }

    // If starts with "jump to ", add jump actions
    if (term.startsWith("jump to ")) {
      const day = query.slice("jump to ".length).trim();
      if (day && !isNaN(parseInt(day, 10))) {
        matched.unshift({
          icon: Calendar,
          label: `Jump grid to Day ${day}`,
          hint: `Navigate to day ${day} in the behavioral matrix`,
          group: "Matrix",
          run: o => {
            o.setView("dashboard");
            // Highlight element or display confirmation
            setCmdOpen(false);
          }
        });
      }
    }

    // Always offer "Ask AI Coach" if query exists and no exact navigation matches perfectly
    if (query.trim().length > 2) {
      matched.unshift({
        icon: Sparkles,
        label: `Ask AI Coach: "${query}"`,
        hint: "Trigger natural language query on behavioral logs",
        group: "AI",
        run: () => {
          handleAskAI(query);
        }
      });
    }

    return matched;
  }, [query, dynamicActions, setCmdOpen]);

  useEffect(() => {
    if (idx >= filtered.length) setIdx(0);
  }, [filtered, idx]);

  useEffect(() => {
    if (!cmdOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCmdOpen(false);
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx(i => Math.min(filtered.length - 1, i + 1));
      }
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx(i => Math.max(0, i - 1));
      }
      else if (e.key === "Enter") {
        e.preventDefault();
        const a = filtered[idx];
        if (a) {
          a.run(os);
          // Don't close if it is the AI question trigger (to let them read the answer!)
          if (a.group !== "AI") {
            setCmdOpen(false);
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cmdOpen, filtered, idx, os, setCmdOpen]);

  return (
    <AnimatePresence>
      {cmdOpen && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-start pt-[14vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <button onClick={() => setCmdOpen(false)} className="absolute inset-0 bg-black/65 backdrop-blur-md" aria-label="Close" />
          <motion.div
            initial={{ y: -10, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-4 w-full max-w-[620px] overflow-hidden rounded-2xl glass-strong ring-soft border border-border/40"
          >
            <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); setIdx(0); setAiAnswer(null); }}
                placeholder="Search commands, start sessions, ask AI (e.g. 'How is my burnout risk?')..."
                className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground/50 font-sans"
              />
              <kbd className="kbd">esc</kbd>
            </div>
            
            <div className="max-h-[45vh] overflow-y-auto p-1.5 scrollbar-thin">
              {filtered.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">No matches</div>
              )}
              {filtered.map((a, i) => (
                <button
                  key={`${a.label}-${i}`}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => {
                    a.run(os);
                    if (a.group !== "AI") setCmdOpen(false);
                  }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    i === idx ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] ring-1 ${
                    i === idx ? "ring-primary/40 bg-primary/10" : "ring-border/60"
                  }`}>
                    <a.icon className={`h-4 w-4 ${i === idx ? "text-primary" : "text-primary/70"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{a.label}</div>
                    <div className="text-[11px] text-muted-foreground">{a.hint}</div>
                  </div>
                  <span className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground bg-white/[0.03] px-1.5 py-0.5 rounded border border-border/40">{a.group}</span>
                  <ArrowRight className={`h-3.5 w-3.5 text-muted-foreground transition-all ${
                    i === idx ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"
                  }`} />
                </button>
              ))}
            </div>

            {loadingAi && (
              <div className="border-t border-border/50 p-4 flex items-center gap-3 text-xs text-muted-foreground bg-white/[0.01]">
                <span className="h-2 w-2 rounded-full bg-primary pulse-dot" />
                <span>AI Coach is scanning behavioral logs...</span>
              </div>
            )}
            
            {aiAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-foreground ring-soft relative overflow-hidden"
              >
                <div className="flex items-center gap-1.5 font-bold text-primary uppercase tracking-wider text-[9px] mb-1.5">
                  <Sparkles className="h-3 w-3" />
                  <span>AI Mission Control response</span>
                </div>
                <p className="text-foreground/90 font-sans">{aiAnswer}</p>
              </motion.div>
            )}

            <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5 text-[10px] text-muted-foreground bg-black/25">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="kbd">⏎</kbd> run command</span>
              </div>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                AI OS Copilot Active
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
