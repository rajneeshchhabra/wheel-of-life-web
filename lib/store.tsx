"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { AppState, Goal, Habit, HabitToLeave, PointsEntry, Section, TaskItem } from "./types";
import { applyDecay, award, streakMultiplier } from "./scoring";
import { defaultSections } from "./catalog";

const STORAGE_KEY = "wheel-of-life-v1";

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calculateMood(state: AppState): AppState["mood"] {
  if (state.sections.length === 0) return "neutral";

  const scores = state.sections.map(s => s.currentScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxDev = Math.max(...scores.map(s => Math.abs(s - avg)));
  const completedToday = state.ledger.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString()).length;

  // Mood logic
  if (avg > 80 && maxDev < 20 && completedToday > 2) return "thriving";
  if (avg > 70 && maxDev < 30 && completedToday > 0) return "happy";
  if (avg > 50 && maxDev < 40) return "content";
  if (maxDev > 50) return "imbalanced";
  if (state.tasks.filter(t => !t.isDone).length > 15) return "overwhelmed";
  if (avg < 40) return "struggling";
  return "neutral";
}

export function initialState(): AppState {
  return {
    version: 1,
    profile: { name: "", purpose: "", northStar: "" },
    sections: [],
    goals: [],
    tasks: [],
    habits: [],
    leaveBehind: [],
    ledger: [],
    buddies: [],
    workoutSessions: [],
    activities: [],
    reactions: [],
    mood: "happy",
    privacySeen: false,
    setupDone: false,
  };
}

export function normalizeState(input: AppState): AppState {
  if (!input || !Array.isArray(input.sections)) throw new Error("Invalid saved data");
  const base = initialState();
  const merged = { ...base, ...input, profile: { ...base.profile, ...input.profile } };
  for (const key of ["goals", "tasks", "habits", "leaveBehind", "ledger", "buddies", "workoutSessions", "activities", "reactions"] as const) {
    if (!Array.isArray(merged[key])) throw new Error(`Invalid saved ${key}`);
  }
  merged.sections = input.sections.map((s, index) => ({
    ...s,
    icon: s.icon ?? "◉", northStar: s.northStar ?? "",
    aspiration: s.aspiration ?? "", aspiration2: s.aspiration2 ?? "",
    sortOrder: s.sortOrder ?? index, enabled: s.enabled ?? true,
    weight: Number.isFinite(s.weight) ? Math.max(1, Math.min(5, s.weight)) : 3,
    currentScore: Number.isFinite(s.currentScore) ? Math.max(0, Math.min(100, s.currentScore)) : 0,
    decayPerDay: Number.isFinite(s.decayPerDay) ? Math.max(0, s.decayPerDay) : 0.5,
    lastDecayAppliedAt: Number.isFinite(Date.parse(s.lastDecayAppliedAt)) ? s.lastDecayAppliedAt : new Date().toISOString(),
    brickCount: Number.isFinite(s.brickCount) && s.brickCount > 0 ? Math.floor(s.brickCount) : 12,
    bricksLit: 0,
  }));
  let normalized = merged;
  for (const section of normalized.sections) normalized = updateBricksForSection(normalized, section.id);
  return { ...normalized, mood: calculateMood(normalized) };
}

export type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "privacySeen" }
  | { type: "completeSetup"; name: string; purpose: string; weights: Record<string, number>; northStar?: string }
  | { type: "setPurpose"; purpose: string }
  | { type: "setName"; name: string }
  | { type: "addLedgerEntry"; sectionId: string; points: number; source: string }
  | { type: "setSectionWeight"; id: string; weight: number }
  | { type: "toggleSection"; id: string }
  | { type: "setAspiration"; id: string; aspiration: string; aspiration2: string; northStar?: string }
  | { type: "addGoal"; sectionId: string; title: string }
  | { type: "achieveGoal"; id: string }
  | { type: "addTask"; sectionId: string; title: string }
  | { type: "completeTask"; id: string }
  | { type: "addHabit"; sectionId: string; title: string }
  | { type: "checkInHabit"; id: string }
  | { type: "addLeaveBehind"; items: Array<{ name: string; note: string }> }
  | { type: "removeLeaveBehind"; id: string }
  | { type: "delete"; kind: "goal" | "task" | "habit"; id: string }
  | { type: "populateDemo" }
  | { type: "eraseAll" }
  | { type: "tickDecay" };

function uid() {
  return crypto.randomUUID();
}

function updateBricksForSection(state: AppState, sectionId: string): AppState {
  // Count achievements (goals + tasks + habits) in this section
  const goals = state.goals.filter(g => g.sectionId === sectionId && g.isAchieved).length;
  const tasks = state.tasks.filter(t => t.sectionId === sectionId && t.isDone).length;
  const habits = state.habits.filter(h => h.sectionId === sectionId && h.isFormed).length;
  const bricksLit = Math.min(goals + tasks + habits, state.sections.find(s => s.id === sectionId)?.brickCount ?? 12); // max 12 bricks

  return {
    ...state,
    sections: state.sections.map(s =>
      s.id === sectionId ? { ...s, bricksLit } : s
    ),
  };
}

function awardTo(state: AppState, sectionId: string, points: number, source: string): AppState {
  const target = state.sections.find((s) => s.id === sectionId);
  if (!target) return state;
  const result = award(points, target, state.sections);
  const entry: PointsEntry = {
    id: uid(),
    sectionId,
    points: result.finalPoints,
    timestamp: new Date().toISOString(),
    source: result.balanceBonusApplied ? `${source} (balance bonus ×1.5)` : source,
  };
  const newState = {
    ...state,
    sections: state.sections.map((s) => (s.id === sectionId ? result.section : s)),
    ledger: [entry, ...state.ledger],
    mood: "happy" as const,
  };
  return { ...newState, mood: calculateMood(newState) };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return normalizeState(action.state);
    case "privacySeen":
      return { ...state, privacySeen: true };
    case "completeSetup": {
      const sections = (state.sections.length ? state.sections : defaultSections()).map((s) => ({
        ...s,
        weight: action.weights[s.id] ?? s.weight,
      }));
      return {
        ...state,
        sections,
        profile: { name: action.name, purpose: action.purpose, northStar: action.northStar },
        setupDone: true,
        privacySeen: true,
      };
    }
    case "setPurpose":
      return { ...state, profile: { ...state.profile, purpose: action.purpose, northStar: action.purpose } };
    case "setName":
      return { ...state, profile: { ...state.profile, name: action.name } };
    case "setSectionWeight":
      return {
        ...state,
        sections: state.sections.map((s) => (s.id === action.id ? { ...s, weight: action.weight } : s)),
      };
    case "toggleSection":
      return {
        ...state,
        sections: state.sections.map((s) => (s.id === action.id ? { ...s, enabled: !s.enabled } : s)),
      };
    case "setAspiration":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.id ? { ...s, aspiration: action.aspiration, aspiration2: action.aspiration2, northStar: action.northStar ?? s.northStar } : s,
        ),
      };
    case "addGoal": {
      const goal: Goal = {
        id: uid(),
        sectionId: action.sectionId,
        title: action.title,
        points: 25,
        isAchieved: false,
        createdAt: new Date().toISOString(),
      };
      return { ...state, goals: [goal, ...state.goals] };
    }
    case "achieveGoal": {
      const goal = state.goals.find((g) => g.id === action.id);
      if (!goal || goal.isAchieved) return state;
      const next = awardTo(state, goal.sectionId, goal.points, `Goal: ${goal.title}`);
      const withGoal = {
        ...next,
        goals: next.goals.map((g) =>
          g.id === action.id ? { ...g, isAchieved: true, achievedAt: new Date().toISOString() } : g,
        ),
      };
      return updateBricksForSection(withGoal, goal.sectionId);
    }
    case "addTask": {
      const task: TaskItem = {
        id: uid(),
        sectionId: action.sectionId,
        title: action.title,
        points: 5,
        isDone: false,
        createdAt: new Date().toISOString(),
      };
      return { ...state, tasks: [task, ...state.tasks] };
    }
    case "completeTask": {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task || task.isDone) return state;
      const next = awardTo(state, task.sectionId, task.points, `Task: ${task.title}`);
      const withTask = {
        ...next,
        tasks: next.tasks.map((t) =>
          t.id === action.id ? { ...t, isDone: true, doneAt: new Date().toISOString() } : t,
        ),
      };
      return updateBricksForSection(withTask, task.sectionId);
    }
    case "addHabit": {
      const habit: Habit = {
        id: uid(),
        sectionId: action.sectionId,
        title: action.title,
        streak: 0,
        targetStreak: 21,
        isFormed: false,
        createdAt: new Date().toISOString(),
      };
      return { ...state, habits: [habit, ...state.habits] };
    }
    case "checkInHabit": {
      const habit = state.habits.find((h) => h.id === action.id);
      const today = todayKey();
      if (!habit || habit.lastCheckIn === today) return state;
      const previousDay = new Date();
      previousDay.setDate(previousDay.getDate() - 1);
      const yesterday = todayKey(previousDay);
      const streak = habit.lastCheckIn === yesterday ? habit.streak + 1 : 1;
      const points = Math.round(3 * streakMultiplier(streak));
      const next = awardTo(state, habit.sectionId, points, `Habit: ${habit.title} (day ${streak})`);
      const withHabit = {
        ...next,
        habits: next.habits.map((h) =>
          h.id === action.id
            ? { ...h, streak, lastCheckIn: today, isFormed: h.isFormed || streak >= h.targetStreak }
            : h,
        ),
      };
      return updateBricksForSection(withHabit, habit.sectionId);
    }
    case "addLeaveBehind": {
      const items: HabitToLeave[] = action.items.map((i) => ({
        id: uid(),
        name: i.name,
        note: i.note,
        createdAt: new Date().toISOString(),
      }));
      return { ...state, leaveBehind: [...items, ...state.leaveBehind] };
    }
    case "removeLeaveBehind":
      return { ...state, leaveBehind: state.leaveBehind.filter((l) => l.id !== action.id) };
    case "delete": {
      const collection = action.kind === "goal" ? state.goals : action.kind === "task" ? state.tasks : state.habits;
      const item = collection.find(i => i.id === action.id);
      if (!item) return state;
      const next = { ...state,
        goals: action.kind === "goal" ? state.goals.filter(i => i.id !== action.id) : state.goals,
        tasks: action.kind === "task" ? state.tasks.filter(i => i.id !== action.id) : state.tasks,
        habits: action.kind === "habit" ? state.habits.filter(i => i.id !== action.id) : state.habits,
      };
      return updateBricksForSection(next, item.sectionId);
    }
    case "populateDemo": {
      const now = new Date().toISOString();
      const sections = state.sections.map((s) => ({ ...s, currentScore: 85, lastDecayAppliedAt: now, bricksLit: 8 }));
      const newState = { ...state, sections };
      newState.mood = calculateMood(newState);
      return newState;
    }
    case "eraseAll":
      return {
        ...initialState(),
        sections: state.sections.map((s) => ({ ...s, currentScore: 0, bricksLit: 0, lastDecayAppliedAt: new Date().toISOString() })),
        privacySeen: true,
        setupDone: true,
        profile: state.profile,
      };
    case "tickDecay": {
      const now = new Date();
      let changed = false;
      const sections = state.sections.map((s) => {
        const d = applyDecay(s, now);
        if (d !== s) changed = true;
        return d;
      });
      return changed ? { ...state, sections } : state;
    }
    case "addLedgerEntry": {
      return awardTo(state, action.sectionId, action.points, action.source);
    }
    default:
      return state;
  }
}

interface StoreValue {
  state: AppState;
  dispatch: (a: Action) => void;
  hydrated: boolean;
  storageError: string | null;
  canUndo: boolean;
  undo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, initialState);
  const previous = useRef<AppState | null>(null);
  const [storageError, setStorageError] = useReducer((_: string | null, value: string | null) => value, null);
  const readFailed = useRef(false);
  const [hydrated, setHydrated] = useReducer(() => true, false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        const normalized = normalizeState(parsed);
        if (!localStorage.getItem(`${STORAGE_KEY}-backup`)) localStorage.setItem(`${STORAGE_KEY}-backup`, raw);
        rawDispatch({ type: "hydrate", state: normalized });
        rawDispatch({ type: "tickDecay" });
      }
    } catch {
      readFailed.current = true;
      setStorageError("Saved data could not be loaded. It has been preserved; reload after checking browser storage.");
    }
    setHydrated();
  }, []);

  useEffect(() => {
    if (!hydrated || readFailed.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(null);
    } catch {
      setStorageError("Changes could not be saved in this browser. Keep this tab open and export a backup from Settings.");
    }
  }, [state, hydrated]);

  const value = useMemo(() => ({ state, hydrated, storageError,
    canUndo: previous.current !== null,
    dispatch: (action: Action) => {
      previous.current = ["completeTask", "achieveGoal", "checkInHabit"].includes(action.type) ? state : null;
      rawDispatch(action);
    },
    undo: () => {
      if (previous.current) { rawDispatch({ type: "hydrate", state: previous.current }); previous.current = null; }
    },
  }), [state, hydrated, storageError]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function sectionById(sections: Section[], id: string) {
  return sections.find((s) => s.id === id);
}
