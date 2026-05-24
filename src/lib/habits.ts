export type HabitCategory = "wellness" | "learning" | "work" | "fitness" | "leisure";

export interface Habit {
  id: string;
  time: string;
  label: string;
  category: HabitCategory;
}

export const DEFAULT_HABITS: Habit[] = [
  { id: "wake", time: "6:00 – 7:00 AM", label: "Wake up + Planning", category: "wellness" },
  { id: "ai-am", time: "7:00 – 9:30 AM", label: "AI Learning", category: "learning" },
  { id: "comm-1", time: "9:30 – 10:00 AM", label: "Communication Practice", category: "learning" },
  { id: "bf", time: "10:00 – 11:00 AM", label: "Breakfast + Rest", category: "wellness" },
  { id: "comm-2", time: "11:00 – 12:00 PM", label: "Communication Practice", category: "learning" },
  { id: "proj-am", time: "12:00 – 2:30 PM", label: "Project Work + AI", category: "work" },
  { id: "lunch", time: "2:30 – 3:30 PM", label: "Lunch + Rest", category: "wellness" },
  { id: "code", time: "3:30 – 5:30 PM", label: "AI Project Coding", category: "work" },
  { id: "walk", time: "5:30 – 6:00 PM", label: "Break + Walk", category: "fitness" },
  { id: "adv", time: "6:00 – 7:00 PM", label: "Advanced AI / DSA / Full Stack", category: "learning" },
  { id: "workout", time: "7:00 – 8:00 PM", label: "Workout", category: "fitness" },
  { id: "dinner", time: "8:00 – 8:30 PM", label: "Dinner + Relax", category: "wellness" },
  { id: "movie", time: "8:30 – 10:00 PM", label: "Movie / Light Learning", category: "leisure" },
];

export type CellState = 0 | 1 | 2 | 3;
export type Mood = "great" | "ok" | "low" | null;

export interface DayMeta {
  mood?: Mood;
  note?: string;
}

export interface MonthData {
  cells: Record<string, CellState>;
  meta: Record<number, DayMeta>;
}

export function getMonthInfo(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return {
      day: i + 1,
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      weekdayLong: d.toLocaleDateString("en-US", { weekday: "long" }),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isToday: d.toDateString() === new Date().toDateString(),
    };
  });
  const weekGroups: { week: number; start: number; end: number }[] = [];
  let currentWeek = 1;
  let weekStart = 1;
  for (let i = 0; i < days.length; i++) {
    const d = new Date(year, month, i + 1);
    const next = new Date(year, month, i + 2);
    const isLastDay = i === days.length - 1;
    if (d.getDay() === 0 || isLastDay) {
      weekGroups.push({ week: currentWeek, start: weekStart, end: i + 1 });
      currentWeek++;
      weekStart = i + 2;
      if (next.getMonth() !== month) break;
    }
  }
  return {
    year, month,
    monthName: date.toLocaleDateString("en-US", { month: "long" }),
    daysInMonth, days, weekGroups,
  };
}

export function storageKey(year: number, month: number) {
  return `habit-tracker:${year}-${month + 1}`;
}

export function loadMonth(year: number, month: number): MonthData {
  if (typeof window === "undefined") return { cells: {}, meta: {} };
  try {
    const raw = localStorage.getItem(storageKey(year, month));
    if (!raw) return { cells: {}, meta: {} };
    return JSON.parse(raw);
  } catch { return { cells: {}, meta: {} }; }
}

export function saveMonth(year: number, month: number, data: MonthData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(year, month), JSON.stringify(data));
}

const HABITS_KEY = "routine-os:habits";

export function loadHabits(): Habit[] {
  if (typeof window === "undefined") return DEFAULT_HABITS;
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) return DEFAULT_HABITS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULT_HABITS;
  } catch { return DEFAULT_HABITS; }
}

export function saveHabits(habits: Habit[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}
