export interface Section {
  id: string;
  name: string;
  icon: string; // emoji icon for section
  colorHex: string;
  sortOrder: number;
  currentScore: number; // 0..100
  lastDecayAppliedAt: string; // ISO
  decayPerDay: number;
  weight: number; // 1..5 — angular width on the wheel
  aspiration: string; // one-word rim label
  aspiration2: string; // fainter label beyond the rim
  northStar: string; // section-specific north star (e.g., "Vibrant Energy Daily")
  brickCount: number; // number of achievement bricks for visualization
  bricksLit: number; // how many bricks are lit up (achievements)
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
  goalId?: string; // HIERARCHICAL: tasks can belong to a goal
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
  northStar?: string; // "Build strong health" etc
  gurus?: string[]; // IDs of selected gurus
}

// BUDDY SYSTEM
export interface Buddy {
  id: string;
  name: string;
  email?: string;
  status: "active" | "pending" | "removed";
  addedAt: string;
}

// WORKOUTS & REGIMENS
export type WorkoutType = "cardio" | "strength" | "flexibility" | "general";

export interface WorkoutRegimen {
  id: string;
  name: string;
  type: WorkoutType;
  description: string;
  durationWeeks: number;
  durationMinPerSession: number;
  frequency: "3x" | "4x" | "5x" | "6x" | "daily"; // per week
}

export interface WorkoutSession {
  id: string;
  habitId: string; // Links to a habit
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  duration: number; // minutes
  distance?: number; // km
  pace?: string; // min:sec per km
  repsData?: Record<string, number>; // exercise name -> reps
  rpe?: number; // 1-5 (Rate of Perceived Exertion)
  notes?: string;
}

// SOCIAL/ACTIVITY
export type ReactionType =
  | "wellDone" | "onFire" | "weveGotYou" | "yes" | "king" // positive
  | "whatHappened" | "noWorries" | "gotThis" | "needHelp" | "together" // supportive
  | "prove" | "ahead" | "sameLol" | "dontTell" | "notBad"; // playful

export interface Activity {
  id: string;
  userId: string;
  type: "habitCompleted" | "goalAchieved" | "streakMilestone" | "levelUp";
  title: string;
  description: string;
  timestamp: string;
  relatedIds?: { sectionId?: string; habitId?: string; goalId?: string };
}

export interface Reaction {
  id: string;
  activityId: string;
  fromBuddyId: string;
  type: ReactionType;
  message?: string;
  timestamp: string;
}

// GURUS (for narrative)
export interface Guru {
  id: string;
  name: string;
  field: string; // "Stoicism", "Entrepreneurship", etc
  oneLineBio: string;
  relatedAreas?: string[]; // Fitness, Relationships, etc
}

export type MoodState = "thriving" | "happy" | "content" | "neutral" | "struggling" | "imbalanced" | "overwhelmed";

export interface AppState {
  version: 1;
  profile: Profile;
  sections: Section[];
  goals: Goal[];
  tasks: TaskItem[];
  habits: Habit[];
  leaveBehind: HabitToLeave[];
  ledger: PointsEntry[];
  buddies: Buddy[];
  workoutSessions: WorkoutSession[];
  activities: Activity[];
  reactions: Reaction[];
  mood: MoodState; // emoticon state - changes with every action
  privacySeen: boolean;
  setupDone: boolean;
}
