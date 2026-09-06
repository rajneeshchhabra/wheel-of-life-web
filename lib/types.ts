export interface Section {
  id: string;
  name: string;
  colorHex: string;
  sortOrder: number;
  currentScore: number; // 0..100
  lastDecayAppliedAt: string; // ISO
  decayPerDay: number;
  weight: number; // 1..5 — angular width on the wheel
  aspiration: string; // one-word rim label
  aspiration2: string; // fainter label beyond the rim
  enabled: boolean;
}

export interface Goal {
  id: string;
  sectionId: string;
  title: string;
  points: number;
  isAchieved: boolean;
  createdAt: string;
  achievedAt?: string;
}

export interface TaskItem {
  id: string;
  sectionId: string;
  title: string;
  points: number;
  isDone: boolean;
  createdAt: string;
  doneAt?: string;
}

export interface Habit {
  id: string;
  sectionId: string;
  title: string;
  streak: number;
  targetStreak: number;
  lastCheckIn?: string; // YYYY-MM-DD
  isFormed: boolean;
  createdAt: string;
}

export interface HabitToLeave {
  id: string;
  name: string;
  note: string;
  createdAt: string;
}

export interface PointsEntry {
  id: string;
  sectionId: string;
  points: number;
  timestamp: string;
  source: string;
}

export interface Profile {
  name: string;
  purpose: string;
}

export interface AppState {
  version: 1;
  profile: Profile;
  sections: Section[];
  goals: Goal[];
  tasks: TaskItem[];
  habits: Habit[];
  leaveBehind: HabitToLeave[];
  ledger: PointsEntry[];
  privacySeen: boolean;
  setupDone: boolean;
}
