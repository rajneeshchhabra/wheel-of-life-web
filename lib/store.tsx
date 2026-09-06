"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { AppState, Goal, Habit, HabitToLeave, PointsEntry, Section, TaskItem } from "./types";
import { applyDecay, award, streakMultiplier } from "./scoring";
import { defaultSections } from "./catalog";

const STORAGE_KEY = "wheel-of-life-v1";

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function initialState(): AppState {
  return {
    version: 1,
    profile: { name: "", purpose: "" },
    sections: [],
    goals: [],
    tasks: [],
    habits: [],
    leaveBehind: [],
    ledger: [],
    privacySeen: false,
    setupDone: false,
  };
}

export type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "privacySeen" }
  | { type: "completeSetup"; name: string; purpose: string; weights: Record<string, number> }
  | { type: "setPurpose"; purpose: string }
  | { type: "setName"; name: string }
  | { type: "setSectionWeight"; id: string; weight: number }
  | { type: "toggleSection"; id: string }
  | { type: "setAspiration"; id: string; aspiration: string; aspiration2: string }
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
  return {
    ...state,
    sections: state.sections.map((s) => (s.id === sectionId ? result.section : s)),
    ledger: [entry, ...state.ledger],
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
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
        profile: { name: action.name, purpose: action.purpose },
        setupDone: true,
        privacySeen: true,
      };
    }
    case "setPurpose":
      return { ...state, profile: { ...state.profile, purpose: action.purpose } };
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
          s.id === action.id ? { ...s, aspiration: action.aspiration, aspiration2: action.aspiration2 } : s,
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
      return {
        ...next,
        goals: next.goals.map((g) =>
          g.id === action.id ? { ...g, isAchieved: true, achievedAt: new Date().toISOString() } : g,
        ),
      };
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
      return {
        ...next,
        tasks: next.tasks.map((t) =>
          t.id === action.id ? { ...t, isDone: true, doneAt: new Date().toISOString() } : t,
        ),
      };
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
      const yesterday = todayKey(new Date(Date.now() - 86_400_000));
      const streak = habit.lastCheckIn === yesterday ? habit.streak + 1 : 1;
      const points = Math.round(3 * streakMultiplier(streak));
      const next = awardTo(state, habit.sectionId, points, `Habit: ${habit.title} (day ${streak})`);
      return {
        ...next,
        habits: next.habits.map((h) =>
          h.id === action.id
            ? { ...h, streak, lastCheckIn: today, isFormed: h.isFormed || streak >= h.targetStreak }
            : h,
        ),
      };
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
    case "delete":
      if (action.kind === "goal") return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
      if (action.kind === "task") return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id) };
    case "populateDemo": {
      const now = new Date().toISOString();
      const sections = state.sections.map((s) => ({ ...s, currentScore: 85, lastDecayAppliedAt: now }));
      return { ...state, sections };
    }
    case "eraseAll":
      return {
        ...initialState(),
        sections: state.sections.map((s) => ({ ...s, currentScore: 0, lastDecayAppliedAt: new Date().toISOString() })),
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
    default:
      return state;
  }
}

interface StoreValue {
  state: AppState;
  dispatch: (a: Action) => void;
  hydrated: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [hydrated, setHydrated] = useReducer(() => true, false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        dispatch({ type: "hydrate", state: parsed });
        dispatch({ type: "tickDecay" });
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage may be unavailable (private mode)
    }
  }, [state, hydrated]);

  const value = useMemo(() => ({ state, dispatch, hydrated }), [state, hydrated]);
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
