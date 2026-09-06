import type { Section } from "./types";

/** Direct port of ScoringEngine.swift from the macOS app. */
export const MIN_SCORE = 0;
export const MAX_SCORE = 100;
export const BALANCE_BONUS_MULTIPLIER = 1.5;

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

/** +10% per consecutive day, capped at ×1.5 from day 5. */
export function streakMultiplier(streak: number) {
  return 1 + 0.1 * clamp(streak, 0, 5);
}

/** Level n costs 30·n·(n+1) lifetime points (L1=60, L2=180, L3=360 …). */
export function levelFor(points: number): { level: number; progress: number } {
  let level = 0;
  while (30 * (level + 1) * (level + 2) <= points) level += 1;
  const floor = 30 * level * (level + 1);
  const ceiling = 30 * (level + 1) * (level + 2);
  return { level, progress: clamp((points - floor) / (ceiling - floor), 0, 1) };
}

function wholeDaysBetween(fromISO: string, to: Date) {
  const from = new Date(fromISO);
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((b - a) / 86_400_000);
}

/** Applies pending decay based on whole days elapsed. Returns an updated copy. */
export function applyDecay(section: Section, now = new Date()): Section {
  const days = wholeDaysBetween(section.lastDecayAppliedAt, now);
  if (days <= 0) return section;
  const decayed = section.currentScore - section.decayPerDay * days;
  return {
    ...section,
    currentScore: clamp(decayed, MIN_SCORE, MAX_SCORE),
    lastDecayAppliedAt: now.toISOString(),
  };
}

export interface AwardResult {
  section: Section;
  basePoints: number;
  finalPoints: number;
  balanceBonusApplied: boolean;
}

/** Awards points; ×1.5 when this is the strictly weakest area — the system pays you to rebalance. */
export function award(points: number, section: Section, all: Section[], now = new Date()): AwardResult {
  const decayed = applyDecay(section, now);
  const scores = all.filter((s) => s.enabled).map((s) => applyDecay(s, now).currentScore);
  let isWeakest = false;
  if (scores.length > 1) {
    const lowest = Math.min(...scores);
    const highest = Math.max(...scores);
    if (highest > lowest) isWeakest = decayed.currentScore <= lowest + 0.0001;
  }
  const finalPoints = isWeakest ? Math.round(points * BALANCE_BONUS_MULTIPLIER) : points;
  return {
    section: { ...decayed, currentScore: clamp(decayed.currentScore + finalPoints, MIN_SCORE, MAX_SCORE) },
    basePoints: points,
    finalPoints,
    balanceBonusApplied: isWeakest,
  };
}

/** Standard deviation of scores — lower is more balanced. */
export function balanceIndex(scores: number[]) {
  if (scores.length < 2) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, s) => a + (s - mean) ** 2, 0) / scores.length;
  return Math.sqrt(variance);
}

/** Equilibrium 0–100: 100 = perfectly balanced. */
export function equilibrium(scores: number[]) {
  return Math.round(Math.max(0, 100 - balanceIndex(scores) * 2.5));
}

export type Band = "green" | "yellow" | "red";

export function equilibriumBand(eq: number): Band {
  if (eq >= 70) return "green";
  if (eq >= 40) return "yellow";
  return "red";
}

export const BAND_COLOR: Record<Band, string> = {
  green: "#30D158",
  yellow: "#FFD60A",
  red: "#FF453A",
};

/** Wheel spin speed (deg/s): 5 actions today ≈ 3×, capped at 6×. */
export function rotationSpeed(actionsToday: number, base = 0.6) {
  return base * Math.min(6, 1 + Math.max(actionsToday, 0) * 0.4);
}
