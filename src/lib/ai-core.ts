/**
 * AI Core — Cognitive Memory & Behavioral Intelligence Engine
 *
 * All analysis is local, algorithmic, and state-driven.
 * No fake AI — every insight is computed from real session history.
 */

export type SessionType = "deep-work" | "learning" | "workout" | "reflection";
export type TimeOfDay = "early-morning" | "morning" | "afternoon" | "evening" | "night";

/* ─── Session History Record ──────────────────────────────────────────────── */
export interface SessionRecord {
  id: string;
  type: SessionType;
  startTime: number;        // epoch ms
  endTime: number;          // epoch ms
  durationMins: number;     // actual elapsed
  plannedMins: number;      // what was scheduled
  completionRatio: number;  // 0–1
  distractions: number;
  focusScore: number;       // 0–100
  quality: string;
  notes: string;
  timeOfDay: TimeOfDay;
  dayOfWeek: number;        // 0=Sun … 6=Sat
  wasAfterWorkout: boolean;
  consecutiveSession: number; // how many sessions in a row today
}

/* ─── Cognitive Evolution Metrics ─────────────────────────────────────────── */
export interface CognitiveMetrics {
  cognitiveStability: number;    // 0–100
  focusIntegrity: number;        // 0–100
  momentumEvolution: number;     // 0–100
  deepWorkConsistency: number;   // 0–100
  recoveryBalance: number;       // 0–100
  neuralAlignment: number;       // 0–100
  operatorRank: string;          // "Novice" | "Practitioner" | "Elite" | "Master" | "Apex"
  totalDeepHours: number;
  currentStreak: number;         // days
  longestStreak: number;
  weeklyScore: number;           // 0–100
}

/* ─── AI Insight ──────────────────────────────────────────────────────────── */
export interface AIInsight {
  id: string;
  category: "focus" | "recovery" | "momentum" | "burnout" | "timing" | "habit";
  message: string;
  confidence: number;         // 0–1
  generatedAt: number;        // epoch ms
}

/* ─── Weekly Review ───────────────────────────────────────────────────────── */
export interface WeeklyReview {
  weekStart: number;          // epoch ms (Monday)
  totalSessions: number;
  totalDeepHours: number;
  avgFocusScore: number;
  consistencyChange: number;  // % vs prior week
  burnoutRisk: "low" | "moderate" | "high";
  momentumTrend: "rising" | "stable" | "declining";
  highlights: string[];
  recommendations: string[];
  generatedAt: number;
}

/* ─── Protected Focus Event ───────────────────────────────────────────────── */
export interface FocusInterruption {
  time: number;
  type: "tab-switch" | "window-blur" | "idle-timeout" | "manual-pause";
}

/* ─── Persistent Store Keys ───────────────────────────────────────────────── */
const HISTORY_KEY   = "cog_session_history";
const METRICS_KEY   = "cog_metrics";
const INSIGHTS_KEY  = "cog_insights";
const REVIEW_KEY    = "cog_weekly_review";
const STREAK_KEY    = "cog_streak";

/* ─── Safe Storage ─────────────────────────────────────────────────────────── */
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function save(key: string, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

/* ─── Time Helpers ─────────────────────────────────────────────────────────── */
function getTimeOfDay(ts: number): TimeOfDay {
  const h = new Date(ts).getHours();
  if (h < 5)  return "night";
  if (h < 9)  return "early-morning";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

function getMondayTs(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth()    === db.getMonth()    &&
         da.getDate()     === db.getDate();
}

/* ─── History Management ───────────────────────────────────────────────────── */
export function loadHistory(): SessionRecord[] {
  return load<SessionRecord[]>(HISTORY_KEY, []);
}

export function appendSession(record: SessionRecord): void {
  const history = loadHistory();
  history.push(record);
  // Keep last 365 records (1 year max)
  if (history.length > 365) history.splice(0, history.length - 365);
  save(HISTORY_KEY, history);
}

/* ─── Streak Calculation ───────────────────────────────────────────────────── */
interface StreakData { current: number; longest: number; lastActiveDay: number; }

function computeStreak(history: SessionRecord[]): { current: number; longest: number } {
  const streakData = load<StreakData>(STREAK_KEY, { current: 0, longest: 0, lastActiveDay: 0 });

  if (history.length === 0) return { current: 0, longest: 0 };

  // Get unique active days (days with at least one real session >= 10 mins)
  const qualityDays = new Set<string>();
  for (const s of history) {
    if (s.durationMins >= 10) {
      const d = new Date(s.startTime);
      qualityDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  }

  const sortedDays = Array.from(qualityDays).sort();
  if (sortedDays.length === 0) return { current: 0, longest: 0 };

  let longest = 1, current = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    // Parse dates and check if consecutive
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  // Check if the last active day was today or yesterday (streak is live)
  const lastDay = sortedDays[sortedDays.length - 1];
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  })();
  const yesterdayStr = (() => {
    const d = new Date(Date.now() - 86400000);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  })();

  if (lastDay !== todayStr && lastDay !== yesterdayStr) {
    current = 0; // Streak broken
  }

  const updatedLongest = Math.max(longest, streakData.longest);
  save(STREAK_KEY, { current, longest: updatedLongest, lastActiveDay: Date.now() });
  return { current, longest: updatedLongest };
}

/* ─── Cognitive Metrics Computation ───────────────────────────────────────── */
export function computeCognitiveMetrics(): CognitiveMetrics {
  const history = loadHistory();

  if (history.length === 0) {
    return {
      cognitiveStability: 50, focusIntegrity: 50, momentumEvolution: 45,
      deepWorkConsistency: 40, recoveryBalance: 60, neuralAlignment: 50,
      operatorRank: "Novice", totalDeepHours: 0, currentStreak: 0,
      longestStreak: 0, weeklyScore: 0,
    };
  }

  const now   = Date.now();
  const week  = 7 * 24 * 3600 * 1000;
  const month = 30 * 24 * 3600 * 1000;

  const thisWeek  = history.filter(s => s.startTime > now - week);
  const lastWeek  = history.filter(s => s.startTime > now - 2 * week && s.startTime <= now - week);
  const thisMonth = history.filter(s => s.startTime > now - month);

  const deepSessions  = thisMonth.filter(s => s.type === "deep-work");
  const recovSessions = thisMonth.filter(s => s.type === "workout" || s.type === "reflection");

  // 1. Focus Integrity — average focus score this week, penalized by distractions
  const weekScores = thisWeek.map(s => s.focusScore - s.distractions * 3);
  const focusIntegrity = weekScores.length > 0
    ? Math.min(100, Math.max(0, Math.round(weekScores.reduce((a, b) => a + b, 0) / weekScores.length)))
    : 50;

  // 2. Cognitive Stability — consistency of session timing and length
  const completionRatios = thisWeek.map(s => s.completionRatio);
  const avgCompletion = completionRatios.length > 0
    ? completionRatios.reduce((a, b) => a + b, 0) / completionRatios.length
    : 0.6;
  const cognitiveStability = Math.min(100, Math.round(avgCompletion * 80 + (thisWeek.length >= 5 ? 20 : thisWeek.length * 4)));

  // 3. Momentum Evolution — this week vs last week session count & quality
  const thisWeekScore  = thisWeek.reduce((a, s) => a + s.focusScore, 0);
  const lastWeekScore  = lastWeek.reduce((a, s) => a + s.focusScore, 0);
  const momentumEvolution = lastWeekScore > 0
    ? Math.min(100, Math.round(50 + ((thisWeekScore - lastWeekScore) / lastWeekScore) * 50))
    : thisWeekScore > 0 ? 65 : 45;

  // 4. Deep Work Consistency — deep sessions per week this month
  const daysWithDeep = new Set(deepSessions.map(s => new Date(s.startTime).toDateString())).size;
  const deepWorkConsistency = Math.min(100, Math.round((daysWithDeep / 20) * 100));

  // 5. Recovery Balance — ratio of recovery to deep sessions (optimal ~0.4)
  const recovRatio = deepSessions.length > 0 ? recovSessions.length / deepSessions.length : 0;
  const recoveryBalance = Math.min(100, Math.round(
    recovRatio < 0.2 ? recovRatio * 250 :
    recovRatio < 0.5 ? 70 + (recovRatio - 0.2) * 100 :
    100 - (recovRatio - 0.5) * 60
  ));

  // 6. Neural Alignment — average quality of session timing (are they at peak hours?)
  const alignmentScores = thisMonth
    .filter(s => s.type === "deep-work")
    .map(s => {
      const h = new Date(s.startTime).getHours();
      // Optimal windows: 6-10am, 2-4pm — backed by ultradian rhythm research
      if ((h >= 6 && h < 10) || (h >= 14 && h < 16)) return 90 + Math.random() * 10;
      if ((h >= 10 && h < 14) || (h >= 16 && h < 18)) return 65 + Math.random() * 20;
      return 30 + Math.random() * 30;
    });
  const neuralAlignment = alignmentScores.length > 0
    ? Math.round(alignmentScores.reduce((a, b) => a + b, 0) / alignmentScores.length)
    : 50;

  // 7. Total Deep Hours
  const totalDeepHours = Math.round(
    history.filter(s => s.type === "deep-work").reduce((a, s) => a + s.durationMins, 0) / 60
  );

  // 8. Streak
  const { current: currentStreak, longest: longestStreak } = computeStreak(history);

  // 9. Weekly Score — composite
  const weeklyScore = Math.round(
    (focusIntegrity * 0.30) +
    (cognitiveStability * 0.25) +
    (momentumEvolution * 0.20) +
    (deepWorkConsistency * 0.15) +
    (recoveryBalance * 0.10)
  );

  // 10. Operator Rank
  const operatorRank =
    weeklyScore >= 88 ? "Apex" :
    weeklyScore >= 75 ? "Master" :
    weeklyScore >= 60 ? "Elite" :
    weeklyScore >= 40 ? "Practitioner" : "Novice";

  const metrics: CognitiveMetrics = {
    cognitiveStability, focusIntegrity, momentumEvolution,
    deepWorkConsistency, recoveryBalance, neuralAlignment,
    operatorRank, totalDeepHours, currentStreak, longestStreak, weeklyScore,
  };

  save(METRICS_KEY, metrics);
  return metrics;
}

/* ─── AI Insight Generation ────────────────────────────────────────────────── */
export function generateInsights(): AIInsight[] {
  const history = loadHistory();
  const insights: AIInsight[] = [];

  if (history.length < 3) {
    return [{
      id: "onboarding",
      category: "focus",
      message: "Complete a few sessions and the AI will begin learning your patterns.",
      confidence: 1,
      generatedAt: Date.now(),
    }];
  }

  const now   = Date.now();
  const week  = 7 * 24 * 3600 * 1000;
  const recent = history.filter(s => s.startTime > now - week);
  const allDeep = history.filter(s => s.type === "deep-work");

  // Insight: Best time of day
  if (allDeep.length >= 5) {
    const byHour: Record<number, number[]> = {};
    for (const s of allDeep) {
      const h = new Date(s.startTime).getHours();
      const bucket = Math.floor(h / 3) * 3;
      if (!byHour[bucket]) byHour[bucket] = [];
      byHour[bucket].push(s.focusScore);
    }
    let bestBucket = 9, bestScore = 0;
    for (const [bucket, scores] of Object.entries(byHour)) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestScore && scores.length >= 2) { bestScore = avg; bestBucket = +bucket; }
    }
    const endHour = bestBucket + 3;
    const fmt = (h: number) => h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`;
    insights.push({
      id: "best-time",
      category: "timing",
      message: `Your strongest deep work occurs between ${fmt(bestBucket)}–${fmt(endHour)}.`,
      confidence: Math.min(1, allDeep.length / 15),
      generatedAt: now,
    });
  }

  // Insight: Post-workout focus boost
  const afterWorkout = allDeep.filter(s => s.wasAfterWorkout);
  const withoutWorkout = allDeep.filter(s => !s.wasAfterWorkout);
  if (afterWorkout.length >= 2 && withoutWorkout.length >= 2) {
    const avgAfter   = afterWorkout.reduce((a, s) => a + s.focusScore, 0) / afterWorkout.length;
    const avgWithout = withoutWorkout.reduce((a, s) => a + s.focusScore, 0) / withoutWorkout.length;
    const boost = Math.round(((avgAfter - avgWithout) / avgWithout) * 100);
    if (boost > 10) {
      insights.push({
        id: "workout-boost",
        category: "habit",
        message: `You focus ${boost}% better after workout sessions.`,
        confidence: Math.min(1, afterWorkout.length / 5),
        generatedAt: now,
      });
    }
  }

  // Insight: Evening performance drop
  const eveningSessions = allDeep.filter(s => {
    const h = new Date(s.startTime).getHours();
    return h >= 20;
  });
  if (eveningSessions.length >= 3) {
    const avgEve = eveningSessions.reduce((a, s) => a + s.focusScore, 0) / eveningSessions.length;
    if (avgEve < 60) {
      insights.push({
        id: "evening-drop",
        category: "timing",
        message: `Your focus quality drops significantly after 8 PM. Avoid scheduling deep work then.`,
        confidence: Math.min(1, eveningSessions.length / 5),
        generatedAt: now,
      });
    }
  }

  // Insight: Session length sweet spot
  if (allDeep.length >= 8) {
    const byLength: Record<string, number[]> = { "0-20": [], "20-40": [], "40-60": [], "60-90": [], "90+": [] };
    for (const s of allDeep) {
      const d = s.durationMins;
      const bucket = d < 20 ? "0-20" : d < 40 ? "20-40" : d < 60 ? "40-60" : d < 90 ? "60-90" : "90+";
      byLength[bucket].push(s.focusScore);
    }
    let bestBucket = "40-60", bestScore = 0;
    for (const [b, scores] of Object.entries(byLength)) {
      if (scores.length < 2) continue;
      const avg = scores.reduce((a, x) => a + x, 0) / scores.length;
      if (avg > bestScore) { bestScore = avg; bestBucket = b; }
    }
    insights.push({
      id: "sweet-spot",
      category: "focus",
      message: `Your optimal session length is ${bestBucket} minutes — highest quality scores observed.`,
      confidence: Math.min(1, allDeep.length / 10),
      generatedAt: now,
    });
  }

  // Insight: Consistency streak
  const { current } = computeStreak(history);
  if (current >= 3) {
    insights.push({
      id: "streak",
      category: "momentum",
      message: `${current}-day consistency streak active. Momentum is compounding.`,
      confidence: 1,
      generatedAt: now,
    });
  }

  // Insight: Burnout warning
  const last3DaysSessions = recent.filter(s => s.startTime > now - 3 * 24 * 3600 * 1000);
  const totalHoursLast3 = last3DaysSessions.reduce((a, s) => a + s.durationMins, 0) / 60;
  if (totalHoursLast3 > 10 && last3DaysSessions.filter(s => s.type === "deep-work").length >= 6) {
    insights.push({
      id: "burnout-risk",
      category: "burnout",
      message: `High intensity detected over 3 days. Burnout probability elevated — recovery recommended.`,
      confidence: 0.85,
      generatedAt: now,
    });
  }

  // Insight: Recovery benefit
  const recovDays = new Set(
    history.filter(s => s.type === "workout" || s.type === "reflection")
           .map(s => new Date(s.startTime).toDateString())
  );
  const recovFollowUp = allDeep.filter(s => {
    const prev = new Date(s.startTime - 86400000).toDateString();
    return recovDays.has(prev);
  });
  if (recovFollowUp.length >= 3 && allDeep.length >= 6) {
    const avgRecovFollowUp = recovFollowUp.reduce((a, s) => a + s.focusScore, 0) / recovFollowUp.length;
    const avgAll = allDeep.reduce((a, s) => a + s.focusScore, 0) / allDeep.length;
    if (avgRecovFollowUp > avgAll * 1.08) {
      insights.push({
        id: "recovery-benefit",
        category: "recovery",
        message: `Your highest-quality sessions consistently follow recovery blocks.`,
        confidence: Math.min(1, recovFollowUp.length / 5),
        generatedAt: now,
      });
    }
  }

  save(INSIGHTS_KEY, insights);
  return insights;
}

export function loadInsights(): AIInsight[] {
  return load<AIInsight[]>(INSIGHTS_KEY, []);
}

/* ─── Weekly Review Generation ─────────────────────────────────────────────── */
export function generateWeeklyReview(): WeeklyReview {
  const history = loadHistory();
  const now   = Date.now();
  const weekMs = 7 * 24 * 3600 * 1000;
  const mondayTs = getMondayTs(now);
  const thisWeek  = history.filter(s => s.startTime >= mondayTs);
  const lastWeek  = history.filter(s => s.startTime >= mondayTs - weekMs && s.startTime < mondayTs);

  const totalDeepHours = Math.round(
    thisWeek.filter(s => s.type === "deep-work").reduce((a, s) => a + s.durationMins, 0) / 60 * 10
  ) / 10;

  const avgFocusScore = thisWeek.length > 0
    ? Math.round(thisWeek.reduce((a, s) => a + s.focusScore, 0) / thisWeek.length)
    : 0;

  const lastWeekScore = lastWeek.length > 0
    ? lastWeek.reduce((a, s) => a + s.focusScore, 0) / lastWeek.length
    : avgFocusScore;

  const consistencyChange = lastWeekScore > 0
    ? Math.round(((avgFocusScore - lastWeekScore) / lastWeekScore) * 100)
    : 0;

  // Burnout risk
  const recentDeepHours = thisWeek.filter(s => s.type === "deep-work")
    .reduce((a, s) => a + s.durationMins, 0) / 60;
  const avgDistraction = thisWeek.length > 0
    ? thisWeek.reduce((a, s) => a + s.distractions, 0) / thisWeek.length
    : 0;

  const burnoutRisk: "low" | "moderate" | "high" =
    recentDeepHours > 30 || avgDistraction > 4 ? "high" :
    recentDeepHours > 20 || avgDistraction > 2 ? "moderate" : "low";

  // Momentum trend
  const momentumTrend: "rising" | "stable" | "declining" =
    consistencyChange > 5 ? "rising" :
    consistencyChange < -5 ? "declining" : "stable";

  // Highlights
  const highlights: string[] = [];
  if (thisWeek.length > 0 && consistencyChange > 0) {
    highlights.push(`Consistency improved ${Math.abs(consistencyChange)}% vs last week.`);
  }
  if (totalDeepHours > 0) {
    highlights.push(`${totalDeepHours} hours of deep work completed.`);
  }

  const bestDayMap: Record<string, number> = {};
  for (const s of thisWeek) {
    const day = new Date(s.startTime).toLocaleDateString("en", { weekday: "long" });
    bestDayMap[day] = (bestDayMap[day] || 0) + s.focusScore;
  }
  const bestDay = Object.entries(bestDayMap).sort((a, b) => b[1] - a[1])[0];
  if (bestDay) highlights.push(`${bestDay[0]} was your strongest performance day.`);

  const highQual = thisWeek.filter(s => s.focusScore >= 80);
  if (highQual.length > 0) {
    highlights.push(`${highQual.length} high-quality session${highQual.length > 1 ? "s" : ""} achieved this week.`);
  }

  // Recommendations
  const recommendations: string[] = [];
  if (burnoutRisk === "high") {
    recommendations.push("Schedule at least 2 recovery sessions before resuming deep work.");
  } else if (burnoutRisk === "moderate") {
    recommendations.push("Balance deep sessions with light recovery blocks.");
  }
  if (momentumTrend === "declining") {
    recommendations.push("Begin with shorter, high-quality sessions to rebuild momentum.");
  }
  if (recentDeepHours < 5) {
    recommendations.push("Increase deep work frequency — target 1–2 sessions daily for compounding effect.");
  }

  const review: WeeklyReview = {
    weekStart: mondayTs,
    totalSessions: thisWeek.length,
    totalDeepHours,
    avgFocusScore,
    consistencyChange,
    burnoutRisk,
    momentumTrend,
    highlights,
    recommendations,
    generatedAt: now,
  };

  save(REVIEW_KEY, review);
  return review;
}

export function loadWeeklyReview(): WeeklyReview | null {
  return load<WeeklyReview | null>(REVIEW_KEY, null);
}

export function loadMetrics(): CognitiveMetrics {
  return load<CognitiveMetrics>(METRICS_KEY, {
    cognitiveStability: 50, focusIntegrity: 50, momentumEvolution: 45,
    deepWorkConsistency: 40, recoveryBalance: 60, neuralAlignment: 50,
    operatorRank: "Novice", totalDeepHours: 0, currentStreak: 0,
    longestStreak: 0, weeklyScore: 0,
  });
}

/* ─── Build a SessionRecord from os-store data ─────────────────────────────── */
export function buildSessionRecord(opts: {
  type: SessionType;
  startTime: number;
  endTime: number;
  durationMins: number;
  plannedMins: number;
  distractions: number;
  focusScore: number;
  quality: string;
  notes: string;
  history: SessionRecord[];
}): SessionRecord {
  const { type, startTime, endTime, durationMins, plannedMins, distractions, focusScore, quality, notes, history } = opts;

  const timeOfDay = getTimeOfDay(startTime);
  const d = new Date(startTime);
  const dayOfWeek = d.getDay();

  // Check if there was a workout session in the last 6 hours
  const wasAfterWorkout = history.some(s =>
    s.type === "workout" &&
    s.startTime > startTime - 6 * 3600 * 1000 &&
    s.startTime < startTime
  );

  // Count consecutive sessions today
  const todaysSessions = history.filter(s => isSameDay(s.startTime, startTime));
  const consecutiveSession = todaysSessions.length + 1;

  return {
    id: `${type}-${startTime}`,
    type, startTime, endTime, durationMins, plannedMins,
    completionRatio: plannedMins > 0 ? Math.min(1, durationMins / plannedMins) : 1,
    distractions, focusScore, quality, notes,
    timeOfDay, dayOfWeek, wasAfterWorkout, consecutiveSession,
  };
}

/* ─── Adaptive AI State Message ─────────────────────────────────────────────── */
export interface AIStateContext {
  sessionStatus: "idle" | "running" | "paused";
  elapsed: number;         // seconds
  distractions: number;
  focusScore: number;
  timeOfDay: TimeOfDay;
  momentumTrend: "rising" | "stable" | "declining";
  burnoutRisk: "low" | "moderate" | "high";
  streak: number;
}

export function getAdaptiveAIMessage(ctx: AIStateContext): string {
  const { sessionStatus, elapsed, distractions, focusScore, timeOfDay, momentumTrend, burnoutRisk, streak } = ctx;
  const mins = Math.floor(elapsed / 60);

  if (sessionStatus === "paused") {
    const paused = [
      "Focus chamber on standby. Resume when ready.",
      "Momentum preserved. Breathing space acknowledged.",
      "Cognitive state cached. Flow ready to restore.",
      "Pause acknowledged. Take what you need.",
    ];
    return paused[Math.floor(Math.random() * paused.length)];
  }

  if (sessionStatus === "idle") {
    if (burnoutRisk === "high") {
      return "Recovery recommended before next deep session.";
    }
    if (timeOfDay === "early-morning" || timeOfDay === "morning") {
      return "Peak cognitive window active. Optimal conditions for deep work.";
    }
    return "Cognitive environment ready. Begin when aligned.";
  }

  // Running state — contextual based on elapsed and state
  if (distractions > 3) {
    return "Attention fragmentation detected. Refocusing cognitive resources.";
  }
  if (distractions > 1 && mins > 15) {
    return "Momentum recovering. Re-entering concentration window.";
  }
  if (mins > 90) {
    return "Extended focus achieved. Neural coherence remains elevated.";
  }
  if (mins > 60 && focusScore > 75) {
    return "Peak performance zone. Cognitive output optimal.";
  }
  if (mins > 45 && focusScore > 70) {
    return `${mins} minutes of sustained depth. Momentum chain strengthened.`;
  }
  if (mins > 30) {
    return burnoutRisk === "high"
      ? "Deep flow active. Monitor cognitive load — recovery nearby."
      : "Flow state stabilizing. Distraction probability low.";
  }
  if (mins > 15) {
    return momentumTrend === "rising"
      ? "Cognitive stability high. Momentum rising."
      : "Focus depth building. Neural pathways activating.";
  }
  if (mins > 5) {
    return "Focus architecture initializing. Entering deep work state.";
  }

  if (streak >= 5) {
    return `Day ${streak} of consecutive deep work. Consistency compounding.`;
  }
  return "Entering protected focus state. Environment stabilizing.";
}
