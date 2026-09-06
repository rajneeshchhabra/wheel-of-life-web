"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

type LogMode = "select" | "cardio" | "strength" | "done";

export default function WorkoutLogger({ habitId, onClose }: { habitId: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [mode, setMode] = useState<LogMode>("select");
  const [cardioData, setCardioData] = useState({ duration: "30", distance: "5", rpe: 3 });
  const [strengthData, setStrengthData] = useState({ duration: "45", exercises: "5", rpe: 3 });

  const habit = state.habits.find((h) => h.id === habitId);

  const handleCardioSubmit = () => {
    // Award points
    dispatch({
      type: "addLedgerEntry",
      sectionId: habit?.sectionId || "",
      points: 15,
      source: "habit",
    });

    // Log workout session
    const session = {
      id: Date.now().toString(),
      habitId,
      date: new Date().toISOString().split("T")[0],
      type: "cardio" as const,
      duration: parseInt(cardioData.duration),
      distance: parseInt(cardioData.distance),
      rpe: cardioData.rpe,
    };

    // In real app, would save this
    console.log("Cardio session:", session);

    setMode("done");
    setTimeout(() => onClose(), 1500);
  };

  const handleStrengthSubmit = () => {
    dispatch({
      type: "addLedgerEntry",
      sectionId: habit?.sectionId || "",
      points: 15,
      source: "habit",
    });

    const session = {
      id: Date.now().toString(),
      habitId,
      date: new Date().toISOString().split("T")[0],
      type: "strength" as const,
      duration: parseInt(strengthData.duration),
      repsData: { exercises: parseInt(strengthData.exercises) },
      rpe: strengthData.rpe,
    };

    console.log("Strength session:", session);
    setMode("done");
    setTimeout(() => onClose(), 1500);
  };

  if (mode === "done") {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-panel rounded-2xl border border-white/10 p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">🔥</div>
          <h2 className="text-2xl font-bold text-text1 mb-2">Great work!</h2>
          <p className="text-text2 text-sm">Your streak is building. Keep it up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-panel rounded-2xl border border-white/10 p-8 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-text1 mb-6">Log Workout</h2>

        {mode === "select" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("cardio")}
              className="w-full p-4 rounded-lg border border-white/10 hover:border-indigo-400/60 hover:bg-panel2 text-left text-text1 font-semibold transition"
            >
              🏃 Cardio (Run, Bike, etc)
            </button>
            <button
              onClick={() => setMode("strength")}
              className="w-full p-4 rounded-lg border border-white/10 hover:border-indigo-400/60 hover:bg-panel2 text-left text-text1 font-semibold transition"
            >
              💪 Strength (Weights, Bodyweight)
            </button>
            <button
              onClick={onClose}
              className="w-full p-4 rounded-lg border border-white/10 text-text2 hover:text-text1 transition"
            >
              Cancel
            </button>
          </div>
        )}

        {mode === "cardio" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text3 block mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={cardioData.duration}
                onChange={(e) => setCardioData({ ...cardioData, duration: e.target.value })}
                className="w-full bg-panel2 text-text1 rounded-lg px-3 py-2 border border-white/10 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-text3 block mb-1">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={cardioData.distance}
                onChange={(e) => setCardioData({ ...cardioData, distance: e.target.value })}
                className="w-full bg-panel2 text-text1 rounded-lg px-3 py-2 border border-white/10 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-text3 block mb-2">How'd it feel?</label>
              <div className="flex gap-1 justify-between">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setCardioData({ ...cardioData, rpe: i })}
                    className={`text-2xl transition ${cardioData.rpe >= i ? "opacity-100" : "opacity-30"}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setMode("select")}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-text2 hover:text-text1 font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleCardioSubmit}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {mode === "strength" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text3 block mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={strengthData.duration}
                onChange={(e) => setStrengthData({ ...strengthData, duration: e.target.value })}
                className="w-full bg-panel2 text-text1 rounded-lg px-3 py-2 border border-white/10 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-text3 block mb-1">Total reps/sets completed</label>
              <input
                type="number"
                value={strengthData.exercises}
                onChange={(e) => setStrengthData({ ...strengthData, exercises: e.target.value })}
                className="w-full bg-panel2 text-text1 rounded-lg px-3 py-2 border border-white/10 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-text3 block mb-2">How'd it feel?</label>
              <div className="flex gap-1 justify-between">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setStrengthData({ ...strengthData, rpe: i })}
                    className={`text-2xl transition ${strengthData.rpe >= i ? "opacity-100" : "opacity-30"}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setMode("select")}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-text2 hover:text-text1 font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleStrengthSubmit}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
