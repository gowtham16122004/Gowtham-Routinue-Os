import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, LayoutGrid, Sun, Sparkles, Timer,
  CalendarDays, BarChart3, Brain, TrendingUp, ShieldAlert, Focus, GitBranch,
  ListChecks, FileText, Zap, Settings as SettingsIcon, BookOpen, Heart, Moon, BatteryCharging, Wand2, X,
} from "lucide-react";
import { useOS, type ViewKey } from "@/lib/os-store";
import { cn } from "@/lib/utils";

interface Item { key: ViewKey; label: string; icon: React.ElementType }
interface Group { title: string; items: Item[] }

const GROUPS: Group[] = [
  { title: "Core", items: [
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "daily", label: "Daily OS", icon: Sun },
    { key: "ai-coach", label: "AI Coach", icon: Sparkles },
    { key: "deep-work", label: "Deep Work", icon: Timer },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ]},
  { title: "Intelligence", items: [
    { key: "intelligence", label: "Behavioral", icon: Brain },
    { key: "momentum", label: "Momentum Engine", icon: TrendingUp },
    { key: "burnout", label: "Burnout Radar", icon: ShieldAlert },
    { key: "focus-analytics", label: "Focus Analytics", icon: Focus },
    { key: "evolution", label: "Evolution", icon: GitBranch },
  ]},
  { title: "Systems", items: [
    { key: "routines", label: "Routines", icon: ListChecks },
    { key: "templates", label: "Templates", icon: FileText },
    { key: "automations", label: "Automations", icon: Zap },
    { key: "focus-modes", label: "Focus Modes", icon: Focus },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ]},
  { title: "Personal", items: [
    { key: "journal", label: "Journal", icon: BookOpen },
    { key: "reflections", label: "Reflections", icon: Heart },
    { key: "mood", label: "Mood", icon: Heart },
    { key: "sleep", label: "Sleep", icon: Moon },
    { key: "energy", label: "Energy", icon: BatteryCharging },
  ]},
];

export function Sidebar() {
  const { view, setView, sidebarCollapsed, setSidebarCollapsed, mode } = useOS();
  const open = !sidebarCollapsed;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setSidebarCollapsed(true)}
            aria-hidden="true"
          />

          {/* Sidebar drawer */}
          <motion.aside
            key="sidebar-drawer"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-[260px]"
          >
            <div className="h-full overflow-hidden rounded-r-2xl glass-strong ring-soft flex flex-col border-r border-border/40">
              {/* Brand */}
              <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-border/40">
                <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/80 to-primary/30 shadow-[0_0_18px_-4px_color-mix(in_oklab,var(--primary)_60%,transparent)]">
                  <Activity className="h-4 w-4 text-white" />
                  <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[13px] font-semibold tracking-tight">Routine OS</div>
                  <div className="text-[10px] text-muted-foreground">Personal Operating System</div>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* AI status pill */}
              <div className="mx-3 mt-3 rounded-xl bg-white/[0.025] ring-1 ring-border/50 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative grid h-6 w-6 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/30 breathe">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-foreground/90">AI Coach Active</div>
                    <div className="text-[9.5px] text-muted-foreground capitalize">Mode · {mode === "operator" ? "Routine" : mode}</div>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                </div>
              </div>

              {/* Nav */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
                {GROUPS.map(g => (
                  <div key={g.title}>
                    <div className="px-2.5 mb-1 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                      {g.title}
                    </div>
                    <div className="space-y-0.5">
                      {g.items.map(it => {
                        const active = view === it.key;
                        return (
                          <button
                            key={it.key}
                            onClick={() => { setView(it.key); setSidebarCollapsed(true); }}
                            className={cn(
                              "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                              active
                                ? "bg-primary/[0.12] text-foreground ring-1 ring-primary/30"
                                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                            )}
                          >
                            {active && (
                              <motion.span
                                layoutId="sidebar-active"
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
                              />
                            )}
                            <it.icon className={cn("h-3.5 w-3.5 shrink-0", active && "text-primary")} />
                            <span className="truncate">{it.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Settings footer */}
              <div className="border-t border-border/40 p-2">
                <button
                  onClick={() => { setView("settings"); setSidebarCollapsed(true); }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors",
                    view === "settings"
                      ? "bg-primary/[0.12] text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  <SettingsIcon className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
