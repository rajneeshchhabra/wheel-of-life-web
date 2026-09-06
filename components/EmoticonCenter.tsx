"use client";

import type { MoodState } from "@/lib/types";

const EMOTICON_MAP: Record<MoodState, { emoji: string; label: string; color: string; message: string }> = {
  thriving: {
    emoji: "🚀",
    label: "Thriving!",
    color: "text-green-400",
    message: "You're crushing it! Keep this momentum!",
  },
  happy: {
    emoji: "😄",
    label: "Happy",
    color: "text-yellow-400",
    message: "Making great progress across your life!",
  },
  content: {
    emoji: "🙂",
    label: "Content",
    color: "text-blue-400",
    message: "You're on a good path. Keep going!",
  },
  neutral: {
    emoji: "😐",
    label: "Neutral",
    color: "text-gray-400",
    message: "Time to pick an area and make some progress!",
  },
  struggling: {
    emoji: "😕",
    label: "Struggling",
    color: "text-orange-400",
    message: "You've got this! Start small, pick one area.",
  },
  imbalanced: {
    emoji: "🤨",
    label: "Imbalanced",
    color: "text-red-400",
    message: "Some areas need love. Spread your energy.",
  },
  overwhelmed: {
    emoji: "😰",
    label: "Overwhelmed",
    color: "text-red-500",
    message: "Pause. Focus on 2 things. You'll feel better.",
  },
};

export default function EmoticonCenter({ mood }: { mood: MoodState }) {
  const current = EMOTICON_MAP[mood];

  return (
    <div className="flex flex-col items-center justify-center group cursor-help">
      {/* Pulsing outer ring */}
      <div className={`relative w-24 h-24 rounded-full border-2 ${current.color} animate-pulse`} />

      {/* Emoticon */}
      <div className="absolute text-6xl select-none transition-all duration-500">{current.emoji}</div>

      {/* Hover tooltip */}
      <div className="absolute -bottom-16 opacity-0 group-hover:opacity-100 transition-opacity bg-panel2 px-3 py-2 rounded-lg whitespace-nowrap text-xs text-text2 border border-white/10 pointer-events-none">
        <div className="font-semibold text-text1">{current.label}</div>
        <div className="text-text3 text-[10px] mt-0.5">{current.message}</div>
      </div>
    </div>
  );
}
