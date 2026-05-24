import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  useCallback,
} from "react";
import { useLocation, useRouter } from "@tanstack/react-router";
import {
  DEFAULT_HABITS,
  loadHabits,
  saveHabits,
  loadMonth,
  saveMonth,
  getMonthInfo,
  type Habit,
  type MonthData,
  type HabitCategory,
} from "@/lib/habits";
import {
  appendSession,
  buildSessionRecord,
  computeCognitiveMetrics,
  generateInsights,
  loadHistory,
  loadMetrics,
  loadInsights,
  type CognitiveMetrics,
  type AIInsight,
  type SessionRecord,
} from "@/lib/ai-core";

export type ViewKey =
  | "dashboard" | "daily" | "ai-coach" | "deep-work" | "calendar" | "analytics"
  | "intelligence" | "momentum" | "burnout" | "focus-analytics" | "evolution"
  | "routines" | "templates" | "automations" | "focus-modes" | "suggestions"
  | "journal" | "reflections" | "mood" | "sleep" | "energy" | "settings";

export type SessionType = "deep-work" | "learning" | "workout" | "reflection";
export type SessionStatus = "idle" | "running" | "paused" | "completed";

export interface SessionStats {
  type: SessionType;
  duration: number;
  focusQuality: string;
  distractions: number;
  score: number;
  notes: string;
}

interface OSState {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  habits: Habit[];
  setHabits: (h: Habit[]) => void;
  data: MonthData;
  setData: (d: MonthData) => void;
  cmdOpen: boolean;
  setCmdOpen: (o: boolean) => void;
  focusMode: boolean;
  setFocusMode: (o: boolean) => void;
  rightPanel: boolean;
  setRightPanel: (o: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (o: boolean) => void;
  mode: "operator" | "deep" | "recovery";
  setMode: (m: "operator" | "deep" | "recovery") => void;

  // Session
  activeSession: SessionType | null;
  sessionStatus: SessionStatus;
  sessionSeconds: number;
  sessionDuration: number;
  sessionNotes: string;
  setSessionNotes: (notes: string) => void;
  startSession: (type: SessionType, mins: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: (cancel?: boolean) => void;
  addTime: (mins: number) => void;
  distractions: number;
  incrementDistractions: () => void;

  addHabit: (label: string, category: HabitCategory, time?: string) => void;

  showSummaryModal: boolean;
  setShowSummaryModal: (show: boolean) => void;
  completedSessionStats: SessionStats | null;
  setCompletedSessionStats: (stats: SessionStats | null) => void;

  // AI Cognitive System
  cognitiveMetrics: CognitiveMetrics;
  aiInsights: AIInsight[];
  sessionHistory: SessionRecord[];
  refreshCognitiveData: () => void;
}

const Ctx = createContext<OSState | null>(null);

const NOTES_KEY = "ticktock_focus_notes";
const SESSION_PERSIST_KEY = "ticktock_session_state";

const isBrowser = typeof window !== "undefined";

function safeGetItem(key: string): string | null {
  if (!isBrowser) return null;
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSetItem(key: string, value: string): void {
  if (!isBrowser) return;
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}
function safeRemoveItem(key: string): void {
  if (!isBrowser) return;
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

interface PersistedSession {
  type: SessionType;
  status: SessionStatus;
  duration: number;
  startAt: number;
  pausedAt: number;
  notes: string;
  distractions?: number;
}

export const VALID_VIEWS = new Set<string>([
  "dashboard", "daily", "ai-coach", "deep-work", "calendar", "analytics",
  "intelligence", "momentum", "burnout", "focus-analytics", "evolution",
  "routines", "templates", "automations", "focus-modes", "suggestions",
  "journal", "reflections", "mood", "sleep", "energy", "settings"
]);

export function OSProvider({ children }: { children: ReactNode }) {
  const info = getMonthInfo();
  const location = useLocation();
  const router = useRouter();

  // Derive active view key from URL path
  const viewParam = location.pathname === "/" ? "dashboard" : location.pathname.replace(/^\//, "");
  const view = (VALID_VIEWS.has(viewParam) ? viewParam : "dashboard") as ViewKey;

  const setView = useCallback((newView: ViewKey) => {
    router.navigate({
      to: newView === "dashboard" ? "/" : `/${newView}`,
    });
  }, [router]);
  const [habits, setHabitsState] = useState<Habit[]>(DEFAULT_HABITS);
  const [data, setDataState] = useState<MonthData>({ cells: {}, meta: {} });
  const [cmdOpen, setCmdOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [rightPanel, setRightPanel] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mode, setMode] = useState<"operator" | "deep" | "recovery">("operator");

  // Session display state (derived from timestamp refs, updated by ticker)
  const [activeSession, setActiveSession] = useState<SessionType | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(25 * 60);
  const [sessionNotes, setSessionNotesState] = useState(
    () => safeGetItem(NOTES_KEY) ?? ""
  );

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [completedSessionStats, setCompletedSessionStats] = useState<SessionStats | null>(null);
  const [distractions, setDistractions] = useState(0);
  const distractionsRef = useRef(0);
  useEffect(() => { distractionsRef.current = distractions; }, [distractions]);

  // AI Cognitive System state
  const [cognitiveMetrics, setCognitiveMetrics] = useState<CognitiveMetrics>(() => loadMetrics());
  const [aiInsights, setAiInsights] = useState<AIInsight[]>(() => loadInsights());
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>(() => loadHistory());
  const sessionStartTimeRef = useRef<number>(0); // tracks real start ms for AI recording

  // ─── Timestamp-based timer (never drifts) ───────────────────────────────
  //
  // Source of truth: startAtRef  (ms timestamp)
  //   remaining = duration - (Date.now() - startAtRef) / 1000
  //
  // On pause:  record pausedAtRef, stop ticker
  // On resume: startAtRef += (Date.now() - pausedAtRef)  → freeze period ignored
  // addTime:   startAtRef -= extraMs                     → shifts end point later
  //
  const startAtRef    = useRef<number>(0);   // adjusted epoch ms of session start
  const pausedAtRef   = useRef<number>(0);   // epoch ms when pause began
  const durationRef   = useRef<number>(25 * 60); // current total duration (secs)
  const statusRef     = useRef<SessionStatus>("idle");
  const activeRef     = useRef<SessionType | null>(null);
  const notesRef      = useRef(sessionNotes);
  const infoRef       = useRef(info);
  const tickerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { notesRef.current = sessionNotes; }, [sessionNotes]);
  useEffect(() => { infoRef.current = info; }, [info]);

  // Forward-declared so endSession can call it and vice-versa through a ref
  const endSessionRef = useRef<(cancel?: boolean) => void>(() => {});

  // ── tick every 250 ms ──
  const stopTicker = useCallback(() => {
    if (tickerRef.current !== null) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  const startTicker = useCallback(() => {
    stopTicker();
    tickerRef.current = setInterval(() => {
      if (statusRef.current !== "running") return;
      const elapsed = (Date.now() - startAtRef.current) / 1000;
      const remaining = durationRef.current - elapsed;
      if (remaining <= 0) {
        stopTicker();
        setSessionSeconds(0);
        // Natural completion
        setTimeout(() => endSessionRef.current(false), 80);
        return;
      }
      setSessionSeconds(Math.round(remaining));
    }, 250);
  }, [stopTicker]);

  // Cleanup on unmount
  useEffect(() => () => stopTicker(), [stopTicker]);

  // ── data loaders ──
  useEffect(() => {
    setHabitsState(loadHabits());
    setDataState(loadMonth(info.year, info.month));
  }, [info.year, info.month]);

  const setHabits = useCallback((h: Habit[]) => {
    setHabitsState(h); saveHabits(h);
  }, []);

  const setData = useCallback((d: MonthData) => {
    setDataState(d); saveMonth(info.year, info.month, d);
  }, [info.year, info.month]);

  const setSessionNotes = useCallback((notes: string) => {
    setSessionNotesState(notes);
    safeSetItem(NOTES_KEY, notes);
  }, []);

  // ── persist session state ──
  const persistSession = useCallback(() => {
    const state: PersistedSession = {
      type: activeRef.current ?? "deep-work",
      status: statusRef.current,
      duration: durationRef.current,
      startAt: startAtRef.current,
      pausedAt: pausedAtRef.current,
      notes: notesRef.current,
      distractions: distractionsRef.current,
    };
    safeSetItem(SESSION_PERSIST_KEY, JSON.stringify(state));
  }, []);

  const clearPersistedSession = useCallback(() => {
    safeRemoveItem(SESSION_PERSIST_KEY);
  }, []);

  // ── session actions ──
  const startSession = useCallback((type: SessionType, mins: number) => {
    stopTicker();

    const secs = mins * 60;
    const now  = Date.now();

    // Update refs first (ticker reads these)
    startAtRef.current  = now;
    durationRef.current = secs;
    statusRef.current   = "running";
    activeRef.current   = type;
    pausedAtRef.current = 0;
    sessionStartTimeRef.current = now; // track for AI memory
    distractionsRef.current = 0;

    // Load persisted notes
    const savedNotes = safeGetItem(NOTES_KEY) ?? "";
    notesRef.current = savedNotes;

    // Update React state
    setActiveSession(type);
    setSessionStatus("running");
    setSessionSeconds(secs);
    setSessionDuration(secs);
    setSessionNotesState(savedNotes);
    setDistractions(0);

    if (type === "deep-work" || type === "learning") {
      setMode("deep");
      setFocusMode(true);
    } else {
      setFocusMode(false);
    }

    startTicker();

    // Persist so session survives refresh
    setTimeout(() => {
      const state: PersistedSession = {
        type, status: "running", duration: secs,
        startAt: now, pausedAt: 0, notes: savedNotes,
        distractions: 0,
      };
      safeSetItem(SESSION_PERSIST_KEY, JSON.stringify(state));
    }, 50);
  }, [stopTicker, startTicker]);

  const pauseSession = useCallback(() => {
    if (statusRef.current !== "running") return;
    stopTicker();
    pausedAtRef.current = Date.now();
    statusRef.current   = "paused";
    setSessionStatus("paused");
    // Persist paused state
    const state: PersistedSession = {
      type: activeRef.current ?? "deep-work",
      status: "paused",
      duration: durationRef.current,
      startAt: startAtRef.current,
      pausedAt: pausedAtRef.current,
      notes: notesRef.current,
      distractions: distractionsRef.current,
    };
    safeSetItem(SESSION_PERSIST_KEY, JSON.stringify(state));
  }, [stopTicker]);

  const resumeSession = useCallback(() => {
    if (statusRef.current !== "paused") return;
    // Shift startAt forward by the duration of the pause
    const pausedMs = Date.now() - pausedAtRef.current;
    startAtRef.current += pausedMs;
    pausedAtRef.current = 0;
    statusRef.current   = "running";
    setSessionStatus("running");
    startTicker();
    // Persist resumed state
    const state: PersistedSession = {
      type: activeRef.current ?? "deep-work",
      status: "running",
      duration: durationRef.current,
      startAt: startAtRef.current,
      pausedAt: 0,
      notes: notesRef.current,
      distractions: distractionsRef.current,
    };
    safeSetItem(SESSION_PERSIST_KEY, JSON.stringify(state));
  }, [startTicker]);

  const addTime = useCallback((mins: number) => {
    const extraSecs = mins * 60;
    durationRef.current += extraSecs;
    setSessionDuration((d) => d + extraSecs);

    if (statusRef.current === "idle") {
      setSessionSeconds(durationRef.current);
    } else {
      // Moving startAt into the past = adding remaining time
      startAtRef.current -= extraSecs * 1000;
      const elapsed = (Date.now() - startAtRef.current) / 1000;
      setSessionSeconds(Math.round(Math.max(0, durationRef.current - elapsed)));
    }

    // Persist updated time if not idle
    if (statusRef.current !== "idle") {
      const state: PersistedSession = {
        type: activeRef.current ?? "deep-work",
        status: statusRef.current,
        duration: durationRef.current,
        startAt: startAtRef.current,
        pausedAt: pausedAtRef.current,
        notes: notesRef.current,
        distractions: distractionsRef.current,
      };
      safeSetItem(SESSION_PERSIST_KEY, JSON.stringify(state));
    }
  }, []);

  const incrementDistractions = useCallback(() => {
    setDistractions((d) => {
      const next = d + 1;
      distractionsRef.current = next;
      if (statusRef.current !== "idle") {
        const state: PersistedSession = {
          type: activeRef.current ?? "deep-work",
          status: statusRef.current,
          duration: durationRef.current,
          startAt: startAtRef.current,
          pausedAt: pausedAtRef.current,
          notes: notesRef.current,
          distractions: next,
        };
        safeSetItem(SESSION_PERSIST_KEY, JSON.stringify(state));
      }
      return next;
    });
  }, []);

  const endSession = useCallback((cancel = false) => {
    stopTicker();
    clearPersistedSession();

    if (cancel || statusRef.current === "idle") {
      statusRef.current = "idle";
      activeRef.current = null;
      setActiveSession(null);
      setSessionStatus("idle");
      setSessionSeconds(0);
      setFocusMode(false);
      setMode("operator");
      return;
    }

    // Compute actual elapsed seconds from timestamps
    const nowMs = Date.now();
    const elapsedSecs = Math.max(0, (nowMs - startAtRef.current) / 1000);
    const trueMins = Math.max(1, Math.round(elapsedSecs / 60));
    const type  = activeRef.current ?? "deep-work";

    const qualities = ["Apex Flow", "Elite State", "Restorative Session", "Mindful Focus"];
    let quality = qualities[1];
    if (type === "workout")    quality = qualities[2];
    if (type === "reflection") quality = qualities[3];
    if (elapsedSecs > durationRef.current * 0.9) quality = qualities[0];

    const finalScore = Math.min(
      100,
      Math.round((elapsedSecs / durationRef.current) * 100)
    );

    setCompletedSessionStats({
      type,
      duration: trueMins,
      focusQuality: quality,
      distractions: distractionsRef.current,
      score: finalScore,
      notes: notesRef.current,
    });
    setShowSummaryModal(true);

    // ── Record to AI Memory ──────────────────────────────────────────────
    const currentHistory = loadHistory();
    const plannedMins = Math.round(durationRef.current / 60);
    const distractionsCount = distractionsRef.current;
    const record = buildSessionRecord({
      type: type as import("@/lib/ai-core").SessionType,
      startTime: sessionStartTimeRef.current || (nowMs - elapsedSecs * 1000),
      endTime: nowMs,
      durationMins: trueMins,
      plannedMins,
      distractions: distractionsCount,
      focusScore: finalScore,
      quality,
      notes: notesRef.current,
      history: currentHistory,
    });
    appendSession(record);
    // Refresh cognitive state after recording
    const newMetrics  = computeCognitiveMetrics();
    const newInsights = generateInsights();
    const newHistory  = loadHistory();
    setCognitiveMetrics(newMetrics);
    setAiInsights(newInsights);
    setSessionHistory(newHistory);
    // ────────────────────────────────────────────────────────────────────

    // Auto-complete habits
    if (type && elapsedSecs >= durationRef.current * 0.5) {
      const today = new Date().getDate();
      const habitMapping: Record<SessionType, string> = {
        "deep-work": "code",
        "learning":  "ai-am",
        "workout":   "workout",
        "reflection": "movie",
      };
      const habitId = habitMapping[type];
      if (habitId) {
        setDataState((cur) => {
          const key  = `${habitId}:${today}`;
          const next = { ...cur, cells: { ...cur.cells, [key]: 1 as const } };
          saveMonth(infoRef.current.year, infoRef.current.month, next);
          return next;
        });
      }
    }

    statusRef.current = "idle";
    activeRef.current = null;
    setActiveSession(null);
    setSessionStatus("idle");
    setSessionSeconds(0);
    setFocusMode(false);
    setMode("operator");
  }, [stopTicker, clearPersistedSession]);

  // Keep ref fresh
  useEffect(() => { endSessionRef.current = endSession; }, [endSession]);

  // ── Restore session from localStorage on mount ──
  useEffect(() => {
    if (!isBrowser) return;
    try {
      const raw = safeGetItem(SESSION_PERSIST_KEY);
      if (!raw) return;
      const saved: PersistedSession = JSON.parse(raw);
      if (!saved || !saved.type || !saved.startAt || !saved.duration) return;
      if (saved.status !== "running" && saved.status !== "paused") {
        clearPersistedSession();
        return;
      }

      // Calculate current remaining time
      let remaining: number;
      if (saved.status === "paused") {
        // Time was frozen when paused
        const elapsedBeforePause = (saved.pausedAt - saved.startAt) / 1000;
        remaining = saved.duration - elapsedBeforePause;
      } else {
        // Session was running — calculate live remaining
        const elapsed = (Date.now() - saved.startAt) / 1000;
        remaining = saved.duration - elapsed;
      }

      // If session already expired, clean up
      if (remaining <= 0) {
        clearPersistedSession();
        return;
      }

      // Restore session state
      startAtRef.current    = saved.startAt;
      pausedAtRef.current   = saved.pausedAt;
      durationRef.current   = saved.duration;
      statusRef.current     = saved.status;
      activeRef.current     = saved.type;
      notesRef.current      = saved.notes || "";
      distractionsRef.current = saved.distractions ?? 0;

      setActiveSession(saved.type);
      setSessionStatus(saved.status);
      setSessionSeconds(Math.round(remaining));
      setSessionDuration(saved.duration);
      setSessionNotesState(saved.notes || "");
      setDistractions(saved.distractions ?? 0);

      if (saved.type === "deep-work" || saved.type === "learning") {
        setMode("deep");
        setFocusMode(true);
      }

      // If running, restart the ticker
      if (saved.status === "running") {
        startTicker();
      }
    } catch {
      clearPersistedSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Global Protected Focus: Visibility & Blur Tracking ──
  useEffect(() => {
    if (sessionStatus !== "running" || !isBrowser) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementDistractions();
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (document.hidden) return; // already counted
        incrementDistractions();
      }, 300);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [sessionStatus, incrementDistractions]);

  // ── Global Protected Focus: Idle Detection ──
  const [lastActivity, setLastActivity] = useState(Date.now());
  useEffect(() => {
    if (sessionStatus !== "running" || !isBrowser) return;

    const onAct = () => setLastActivity(Date.now());
    window.addEventListener("mousemove", onAct, { passive: true });
    window.addEventListener("keydown",   onAct, { passive: true });

    const id = setInterval(() => {
      if (Date.now() - lastActivity > 45_000) {
        incrementDistractions();
        setLastActivity(Date.now());
      }
    }, 15_000);

    return () => {
      window.removeEventListener("mousemove", onAct);
      window.removeEventListener("keydown",   onAct);
      clearInterval(id);
    };
  }, [sessionStatus, lastActivity, incrementDistractions]);

  const refreshCognitiveData = useCallback(() => {
    setCognitiveMetrics(computeCognitiveMetrics());
    setAiInsights(generateInsights());
    setSessionHistory(loadHistory());
  }, []);

  const addHabit = useCallback((label: string, category: HabitCategory, time = "12:00 – 1:00 PM") => {
    const id = `custom-${Date.now()}`;
    const newHabit: Habit = { id, label, category, time };
    setHabitsState((curr) => {
      const next = [...curr, newHabit];
      saveHabits(next);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{
      view, setView, habits, setHabits, data, setData,
      cmdOpen, setCmdOpen, focusMode, setFocusMode,
      rightPanel, setRightPanel, sidebarCollapsed, setSidebarCollapsed,
      mode, setMode,
      activeSession, sessionStatus, sessionSeconds, sessionDuration,
      sessionNotes, setSessionNotes,
      startSession, pauseSession, resumeSession, endSession, addTime,
      distractions, incrementDistractions,
      addHabit,
      showSummaryModal, setShowSummaryModal,
      completedSessionStats, setCompletedSessionStats,
      cognitiveMetrics, aiInsights, sessionHistory, refreshCognitiveData,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useOS() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOS must be used within OSProvider");
  return ctx;
}
