import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sun, Sparkles, Timer, CalendarDays, BarChart3, TrendingUp, ShieldAlert, Focus, GitBranch, ListChecks, FileText, Zap, BookOpen, Heart, Moon, BatteryCharging, Wand2 } from "lucide-react";
import { useEffect } from "react";
import { OSProvider, useOS } from "@/lib/os-store";
import { Sidebar } from "@/components/shell/Sidebar";
import { HeaderBar } from "@/components/shell/HeaderBar";
import { ContextPanel } from "@/components/shell/ContextPanel";
import { FocusMode } from "@/components/shell/FocusMode";
import { CommandPalette } from "@/components/CommandPalette";
import { HabitTracker } from "@/components/HabitTracker";
import { StatsDashboard } from "@/components/StatsDashboard";
import { IntelligenceHero } from "@/components/IntelligenceHero";
import { InsightsPanel } from "@/components/InsightsPanel";
import { DailyOSView } from "@/components/views/DailyOSView";
import { SettingsView } from "@/components/views/SettingsView";
import { JournalView } from "@/components/views/JournalView";
import { PlaceholderView } from "@/components/views/PlaceholderView";
import { IntelligenceView } from "@/components/views/IntelligenceView";
import { RecoveryMode } from "@/components/shell/RecoveryMode";
import { ChecklistFullscreen } from "@/components/ChecklistFullscreen";

export const Route = createFileRoute("/")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Routine OS — Behavioral Operating System" },
      { name: "description", content: "An AI-powered personal operating system for elite performance." },
    ],
  }),
});

export function Page() {
  return (
    <OSProvider>
      <Shell />
    </OSProvider>
  );
}

function Shell() {
  const { setCmdOpen, focusMode, mode, checklistMode } = useOS();

  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("mode-operator", "mode-deep", "mode-recovery");
    el.classList.add(`mode-${mode}`);
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCmdOpen]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient atmosphere — always present */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="fog float-y" style={{ top: -120, left: "10%", width: 520, height: 520 }} />
        <div className="fog float-y" style={{ bottom: -160, right: "10%", width: 600, height: 600, animationDelay: "2s" }} />
        <div className="light-streak" style={{ top: "22%", left: "-10%", width: "120%", height: 1 }} />
        <div className="light-streak" style={{ top: "68%", left: "-10%", width: "120%", height: 1, opacity: 0.3 }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,color-mix(in_oklab,var(--background)_70%,transparent)_100%)]" />
      </div>

      <AnimatePresence mode="wait">
        {checklistMode ? (
          /* ─── CHECKLIST WORKSPACE — NOTHING ELSE RENDERS ─── */
          <motion.div
            key="checklist-workspace"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen"
          >
            <ChecklistFullscreen />
          </motion.div>
        ) : (
          /* ─── NORMAL DASHBOARD ─── */
          <motion.div
            key="dashboard-workspace"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen"
          >
            <div className={`min-h-screen flex flex-col transition-all duration-700 ${focusMode ? "opacity-0 pointer-events-none scale-[0.98]" : "opacity-100 scale-100"}`} style={{ transformOrigin: "center", transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}>
              <main className="flex-1 min-w-0 flex flex-col">
                <HeaderBar />
                <div className="flex-1 px-4 pb-10 md:px-6">
                  <ViewRouter />
                </div>
              </main>
            </div>

            {/* Fixed overlay panels — only visible in dashboard mode */}
            <Sidebar />
            <ContextPanel />
            <CommandPalette />
            <FocusMode />
            <RecoveryMode />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ViewRouter() {
  const { view } = useOS();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={view}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
        {renderView(view)}
      </motion.div>
    </AnimatePresence>
  );
}

function renderView(view: string) {
  switch (view) {
    case "dashboard":
      return (
        <div className="space-y-5">
          <IntelligenceHero />
          <InsightsPanel />
          <StatsDashboard />
          <HabitTracker />
        </div>
      );
    case "daily": return <DailyOSView />;
    case "calendar":
    case "analytics":
      return (
        <div className="space-y-5">
          <StatsDashboard />
          <HabitTracker />
        </div>
      );
    case "ai-coach":
      return (
        <div className="space-y-5">
          <IntelligenceHero />
          <InsightsPanel />
        </div>
      );
    case "deep-work":
      return <PlaceholderView icon={Timer} subtitle="Systems" title="Deep Work" body="Start a focus session from the right panel or press ⌘K → 'Toggle Focus Mode'. Sessions are logged into your behavioral memory." />;
    case "intelligence": return <IntelligenceView />;
    case "momentum": return <PlaceholderView icon={TrendingUp} subtitle="Intelligence" title="Momentum Engine" body="Tracks week-over-week trajectory and predicts the next 7-day momentum band." />;
    case "burnout": return <PlaceholderView icon={ShieldAlert} subtitle="Intelligence" title="Burnout Radar" body="Detects elevated cognitive load and recommends recovery windows before performance dips." />;
    case "focus-analytics": return <PlaceholderView icon={Focus} subtitle="Intelligence" title="Focus Analytics" body="Breaks down deep-work hours by block, time-of-day, and quality." />;
    case "evolution": return <PlaceholderView icon={GitBranch} subtitle="Intelligence" title="Performance Evolution" body="Long-range timeline of your behavioral patterns and identity shifts." />;
    case "routines": return <SettingsView />;
    case "templates": return <PlaceholderView icon={FileText} subtitle="Systems" title="Templates" body="Save weekday, weekend, and seasonal routine presets — swap them with one click." />;
    case "automations": return <PlaceholderView icon={Zap} subtitle="Systems" title="Automations" body="Trigger behaviors automatically: 'If workout missed twice → suggest recovery day.'" />;
    case "focus-modes": return <PlaceholderView icon={Focus} subtitle="Systems" title="Focus Modes" body="Switch between Operator, Deep, and Recovery from the header — each mode tunes UI density and AI sensitivity." />;
    case "suggestions": return <PlaceholderView icon={Wand2} subtitle="Systems" title="AI Suggestions" body="Daily AI-generated routine optimizations based on your last 30 days of data." />;
    case "journal": return <JournalView />;
    case "reflections": return <PlaceholderView icon={Heart} subtitle="Personal" title="Reflections" body="Weekly AI-generated reflection summaries from your daily journal entries." />;
    case "mood": return <PlaceholderView icon={Heart} subtitle="Personal" title="Mood Tracking" body="Tap the mood row in the matrix to log a state. Trends surface here." />;
    case "sleep": return <PlaceholderView icon={Moon} subtitle="Personal" title="Sleep Tracking" body="Log sleep windows to correlate rest with next-day cognitive output." />;
    case "energy": return <PlaceholderView icon={BatteryCharging} subtitle="Personal" title="Energy Analysis" body="A circadian heatmap of when you operate at peak vs depleted." />;
    case "settings": return <SettingsView />;
    default: return null;
  }
}
