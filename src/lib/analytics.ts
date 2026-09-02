/**
 * analytics.ts — Pure analytics helpers for the Routine OS dashboard.
 *
 * All functions derive metrics ONLY from actual habit completion data.
 * Cell states: 0 = empty, 1 = done, 2 = partial, 3 = missed
 *
 * These are pure functions with no side effects.
 */

import type { Habit, MonthData } from "@/lib/habits";

export type CellState = 0 | 1 | 2 | 3;

// ─── Today's Completion ───────────────────────────────────────────────────────

export interface TodayCompletion {
  done: number;
  partial: number;
  missed: number;
  remaining: number;
  total: number;
  pct: number;         // done / total (%)
  doneNames: string[]; // labels of completed habits today
}

export function getTodayCompletion(
  habits: Habit[],
  data: MonthData,
  today: number
): TodayCompletion {
  let done = 0, partial = 0, missed = 0;
  const doneNames: string[] = [];

  for (const h of habits) {
    const s = data.cells[`${h.id}:${today}`] as CellState | undefined ?? 0;
    if (s === 1) { done++; doneNames.push(h.label); }
    else if (s === 2) partial++;
    else if (s === 3) missed++;
  }

  const total = habits.length;
  const remaining = total - done - partial - missed;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return { done, partial, missed, remaining, total, pct, doneNames };
}

// ─── Weekly Completion ────────────────────────────────────────────────────────

/** Returns completion % for the last `window` days (including today). */
export function getWeeklyCompletion(
  habits: Habit[],
  data: MonthData,
  today: number,
  window = 7
): number {
  if (habits.length === 0) return 0;
  let done = 0;
  const start = Math.max(1, today - window + 1);
  const days = today - start + 1;

  for (const h of habits) {
    for (let d = start; d <= today; d++) {
      if (data.cells[`${h.id}:${d}`] === 1) done++;
    }
  }

  return Math.round((done / Math.max(1, habits.length * days)) * 100);
}

// ─── Monthly Completion ───────────────────────────────────────────────────────

/** Returns completion % for the entire month up to `today`. */
export function getMonthlyCompletion(
  habits: Habit[],
  data: MonthData,
  today: number
): number {
  if (habits.length === 0 || today === 0) return 0;
  let done = 0;

  for (const h of habits) {
    for (let d = 1; d <= today; d++) {
      if (data.cells[`${h.id}:${d}`] === 1) done++;
    }
  }

  return Math.round((done / Math.max(1, habits.length * today)) * 100);
}

// ─── Current Streak ───────────────────────────────────────────────────────────

/**
 * A "good day" = at least 70% of habits done.
 * Streak = consecutive good days ending on or before today.
 */
export function getCurrentStreak(
  habits: Habit[],
  data: MonthData,
  today: number
): number {
  if (habits.length === 0) return 0;
  const threshold = Math.ceil(habits.length * 0.7);
  let streak = 0;

  for (let d = today; d >= 1; d--) {
    let done = 0;
    for (const h of habits) {
      if (data.cells[`${h.id}:${d}`] === 1) done++;
    }
    if (done >= threshold) streak++;
    else break;
  }

  return streak;
}

// ─── Per-habit completion counts ─────────────────────────────────────────────

/** Returns { habitId → completionCount } for the last `window` days. */
function habitCountsInWindow(
  habits: Habit[],
  data: MonthData,
  today: number,
  window: number
): Record<string, number> {
  const start = Math.max(1, today - window + 1);
  const counts: Record<string, number> = {};
  for (const h of habits) {
    counts[h.id] = 0;
    for (let d = start; d <= today; d++) {
      if (data.cells[`${h.id}:${d}`] === 1) counts[h.id]++;
    }
  }
  return counts;
}

// ─── Strongest Routine ────────────────────────────────────────────────────────

export interface RoutineStats {
  habit: Habit;
  count: number;     // completions in window
  total: number;     // days in window
  pct: number;       // completion % in window
}

export function getStrongestRoutine(
  habits: Habit[],
  data: MonthData,
  today: number,
  window = 7
): RoutineStats | null {
  if (habits.length === 0 || today === 0) return null;
  const actualWindow = Math.min(window, today);
  const counts = habitCountsInWindow(habits, data, today, actualWindow);
  const sorted = habits.slice().sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
  const best = sorted[0];
  if (!best) return null;
  const count = counts[best.id] ?? 0;
  return { habit: best, count, total: actualWindow, pct: Math.round((count / actualWindow) * 100) };
}

// ─── Weakest Routine ─────────────────────────────────────────────────────────

export function getWeakestRoutine(
  habits: Habit[],
  data: MonthData,
  today: number,
  window = 7
): RoutineStats | null {
  if (habits.length === 0 || today === 0) return null;
  const actualWindow = Math.min(window, today);
  const counts = habitCountsInWindow(habits, data, today, actualWindow);
  const sorted = habits.slice().sort((a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0));
  const worst = sorted[0];
  if (!worst) return null;
  const count = counts[worst.id] ?? 0;
  return { habit: worst, count, total: actualWindow, pct: Math.round((count / actualWindow) * 100) };
}

// ─── Momentum ─────────────────────────────────────────────────────────────────

export interface MomentumResult {
  pct: number;           // % change vs previous window (0 if no prior data)
  hasEnoughData: boolean; // false when prev window has no data
  direction: "up" | "down" | "flat";
}

/**
 * Compares last 7 days vs previous 7 days.
 * `hasEnoughData` = false when there are fewer than 8 days of history.
 */
export function getMomentum(
  habits: Habit[],
  data: MonthData,
  today: number
): MomentumResult {
  if (habits.length === 0 || today < 2) {
    return { pct: 0, hasEnoughData: false, direction: "flat" };
  }

  const last7 = perDayTotals(habits, data, Math.max(1, today - 6), today);
  const prev7 = perDayTotals(habits, data, Math.max(1, today - 13), Math.max(0, today - 7));

  const lastSum = last7.reduce((a, b) => a + b, 0);
  const prevSum = prev7.reduce((a, b) => a + b, 0);

  if (prevSum === 0) {
    // Not enough historical data for a meaningful comparison
    return { pct: lastSum > 0 ? 100 : 0, hasEnoughData: false, direction: lastSum > 0 ? "up" : "flat" };
  }

  const pct = Math.round(((lastSum - prevSum) / prevSum) * 100);
  return {
    pct: Math.abs(pct),
    hasEnoughData: today >= 8,
    direction: pct > 3 ? "up" : pct < -3 ? "down" : "flat",
  };
}

// ─── Discipline Index ─────────────────────────────────────────────────────────

export interface DisciplineIndex {
  score: number;       // 0–100
  label: string;       // human-readable tier
  consistency: number; // % of days meeting 70% threshold
  completion: number;  // overall completion %
  stability: number;   // week-over-week variation stability 0–100
}

export function getDisciplineIndex(
  habits: Habit[],
  data: MonthData,
  today: number
): DisciplineIndex {
  if (habits.length === 0 || today === 0) {
    return { score: 0, label: "No Data", consistency: 0, completion: 0, stability: 0 };
  }

  // Consistency: % of days where ≥70% habits were done
  const threshold = Math.ceil(habits.length * 0.7);
  let goodDays = 0;
  for (let d = 1; d <= today; d++) {
    let done = 0;
    for (const h of habits) {
      if (data.cells[`${h.id}:${d}`] === 1) done++;
    }
    if (done >= threshold) goodDays++;
  }
  const consistency = Math.round((goodDays / today) * 100);

  // Completion: overall % done
  const completion = getMonthlyCompletion(habits, data, today);

  // Stability: variance in week-over-week completion (lower variance = higher stability)
  const streak = getCurrentStreak(habits, data, today);
  const stabilityRaw = Math.min(100, Math.round(consistency * 0.5 + Math.min(streak, 14) / 14 * 50));
  const stability = stabilityRaw;

  const score = Math.min(100, Math.round(consistency * 0.4 + completion * 0.4 + stability * 0.2));

  const label =
    score >= 80 ? "Elite" :
    score >= 60 ? "Consistent" :
    score >= 40 ? "Developing" :
    score >= 20 ? "Building" :
    "Starting";

  return { score, label, consistency, completion, stability };
}

// ─── Consistency Trend ────────────────────────────────────────────────────────

export type ConsistencyTrend = "improving" | "stable" | "declining" | "insufficient";

/**
 * Compares first half vs second half of available data.
 * Requires at least 4 days to show a trend.
 */
export function getConsistencyTrend(
  habits: Habit[],
  data: MonthData,
  today: number
): ConsistencyTrend {
  if (habits.length === 0 || today < 4) return "insufficient";

  const half = Math.floor(today / 2);
  const firstHalf = perDayTotals(habits, data, 1, half);
  const secondHalf = perDayTotals(habits, data, half + 1, today);

  const avg1 = firstHalf.reduce((a, b) => a + b, 0) / Math.max(1, firstHalf.length);
  const avg2 = secondHalf.reduce((a, b) => a + b, 0) / Math.max(1, secondHalf.length);

  const diff = avg2 - avg1;
  if (diff > 0.5) return "improving";
  if (diff < -0.5) return "declining";
  return "stable";
}

// ─── Best Habit Combination ───────────────────────────────────────────────────

export interface CombinationResult {
  habitA: Habit;
  habitB: Habit;
  coOccurrences: number; // days both were done
  window: number;        // days checked
}

/**
 * Finds the pair of habits most frequently completed on the same day.
 * Only returns a result if there's a meaningful pattern (≥ 3 co-occurrences).
 */
export function getBestCombination(
  habits: Habit[],
  data: MonthData,
  today: number,
  window = 14
): CombinationResult | null {
  if (habits.length < 2 || today < 3) return null;

  const actualWindow = Math.min(window, today);
  const start = Math.max(1, today - actualWindow + 1);

  let bestCount = 0;
  let bestPair: [Habit, Habit] | null = null;

  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      let coCount = 0;
      for (let d = start; d <= today; d++) {
        if (data.cells[`${habits[i].id}:${d}`] === 1 && data.cells[`${habits[j].id}:${d}`] === 1) {
          coCount++;
        }
      }
      if (coCount > bestCount) {
        bestCount = coCount;
        bestPair = [habits[i], habits[j]];
      }
    }
  }

  if (!bestPair || bestCount < 3) return null;

  return {
    habitA: bestPair[0],
    habitB: bestPair[1],
    coOccurrences: bestCount,
    window: actualWindow,
  };
}

// ─── Routine Consistency ─────────────────────────────────────────────────────

/** Returns completion % for a single habit over the last `window` days. */
export function getRoutineConsistency(
  habitId: string,
  data: MonthData,
  today: number,
  window = 7
): number {
  const start = Math.max(1, today - window + 1);
  const days = today - start + 1;
  let done = 0;
  for (let d = start; d <= today; d++) {
    if (data.cells[`${habitId}:${d}`] === 1) done++;
  }
  return days === 0 ? 0 : Math.round((done / days) * 100);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Returns total done count per day for days [from..to]. */
function perDayTotals(
  habits: Habit[],
  data: MonthData,
  from: number,
  to: number
): number[] {
  const result: number[] = [];
  for (let d = from; d <= to; d++) {
    let done = 0;
    for (const h of habits) {
      if (data.cells[`${h.id}:${d}`] === 1) done++;
    }
    result.push(done);
  }
  return result;
}
