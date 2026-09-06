import type { Section } from "./types";

export const ESSENTIAL_AREAS = ["fitness", "health", "financial", "money"];

export function isEssential(name: string) {
  return ESSENTIAL_AREAS.includes(name.toLowerCase());
}

/** The six areas from the original whiteboard "Circle of my Life", in wheel order. */
export function defaultSections(now = new Date()): Section[] {
  const specs: Array<[string, string, string, string]> = [
    ["Fitness", "#E5484D", "STRENGTH", "ENERGY"],
    ["Life", "#0090FF", "JOY", "PRESENCE"],
    ["Relationship", "#8E4EC6", "LOVE", "BELONGING"],
    ["Financial", "#30A46C", "FREEDOM", "EXPERIENCES"],
    ["Mindset", "#F76B15", "CLARITY", "PEACE"],
    ["Professional", "#3E63DD", "MASTERY", "IMPACT"],
  ];
  return specs.map(([name, colorHex, aspiration, aspiration2], i) => ({
    id: crypto.randomUUID(),
    name,
    colorHex,
    sortOrder: i,
    currentScore: 0,
    lastDecayAppliedAt: now.toISOString(),
    decayPerDay: 0.5,
    weight: 3,
    aspiration,
    aspiration2,
    enabled: true,
  }));
}

/** Common patterns people want to stop — "nothing changes unless you do too". */
export const LEAVE_BEHIND_CATALOG: Array<{ name: string; note: string }> = [
  { name: "Speaking too fast", note: "Slow down, listen more, give space for others" },
  { name: "Judging people", note: "Everyone has their own journey" },
  { name: "Overly trusting", note: "Trust, but verify — protect your energy" },
  { name: "Not trusting enough", note: "Take the risk, give people a chance" },
  { name: "Perfectionism", note: "Done is better than perfect" },
  { name: "Procrastination", note: "Start small, just begin" },
  { name: "Self-doubt", note: "You are more capable than you think" },
  { name: "People-pleasing", note: "Your needs matter too — learn to say no" },
  { name: "Comparing myself", note: "Your journey is yours alone" },
  { name: "Negative self-talk", note: "Speak to yourself like a friend" },
  { name: "Holding grudges", note: "Forgive, release, let go" },
  { name: "Fear of failure", note: "Failure is feedback" },
  { name: "Overthinking", note: "Trust your gut, act with intention" },
  { name: "Blaming others", note: "Focus on what you control" },
  { name: "Doomscrolling", note: "Put the phone down, look up" },
  { name: "Saying yes to everything", note: "Every yes is a no to something else" },
];
