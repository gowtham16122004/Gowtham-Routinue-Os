import { motion } from "framer-motion";
import { Command, Sparkles, Focus, Activity, Search, Layers } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  onOpenCommand: () => void;
  onToggleFocus: () => void;
  focusMode: boolean;
}

export function FloatingNav({ onOpenCommand, onToggleFocus, focusMode }: Props) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-4 z-40 mx-auto mb-6 flex w-fit max-w-full items-center gap-1.5 rounded-full glass-strong px-2 py-1.5 ring-soft"
    >
      <div className="flex items-center gap-2 px-2.5 py-1">
        <div className="relative grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-primary/80 to-primary/40">
          <Activity className="h-3 w-3 text-white" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
        </div>
        <span className="font-display text-[13px] font-semibold tracking-tight">Routine OS</span>
      </div>

      <span className="mx-1 h-5 w-px bg-border/60" />

      <NavButton icon={Layers} label="Workspace" />
      <NavButton icon={Sparkles} label="AI Coach" active />
      <button
        onClick={onToggleFocus}
        className={`magnetic flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${
          focusMode
            ? "bg-primary/15 text-foreground ring-1 ring-primary/40 accent-glow"
            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        }`}
      >
        <Focus className="h-3.5 w-3.5" />
        Focus
      </button>

      <span className="mx-1 h-5 w-px bg-border/60" />

      <button
        onClick={onOpenCommand}
        className="magnetic group flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1.5 text-[12px] text-muted-foreground ring-1 ring-border/60 hover:bg-white/[0.06] hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search or run a command</span>
        <span className="hidden items-center gap-0.5 sm:flex">
          <kbd className="kbd">⌘</kbd>
          <kbd className="kbd">K</kbd>
        </span>
      </button>

      <span className="mx-1 hidden h-5 w-px bg-border/60 md:block" />

      <div className="hidden items-center gap-2 px-2.5 py-1 text-[11px] text-muted-foreground md:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Synced · {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </motion.div>
  );
}

function NavButton({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <button
      className={`magnetic flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${
        active
          ? "bg-white/[0.05] text-foreground ring-1 ring-border/60"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
