"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { levelFor, rotationSpeed } from "@/lib/scoring";
import WheelCanvas from "@/components/WheelCanvas";
import { AccomplishedRail, InPlayRail, Modal } from "@/components/Rails";
import Settings from "@/components/Settings";
import OnboardingSimple from "@/components/OnboardingSimple";
import BuddyFeed from "@/components/BuddyFeed";
import WorkoutLogger from "@/components/WorkoutLogger";
import type { Section } from "@/lib/types";

export default function Dashboard() {
  const { state, hydrated } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState<Section | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showWorkoutLogger, setShowWorkoutLogger] = useState(false);
  const [selectedHabitForWorkout, setSelectedHabitForWorkout] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const { levels, todayGains, actionsToday, suggestedTasks } = useMemo(() => {
    const lifetime: Record<string, number> = {};
    const gains: Record<string, number> = {};
    let today = 0;
    const now = new Date();
    for (const e of state.ledger) {
      lifetime[e.sectionId] = (lifetime[e.sectionId] ?? 0) + e.points;
      const d = new Date(e.timestamp);
      if (d.toDateString() === now.toDateString()) {
        gains[e.sectionId] = (gains[e.sectionId] ?? 0) + e.points;
        today += 1;
      }
    }
    const levels = Object.fromEntries(Object.entries(lifetime).map(([k, v]) => [k, levelFor(v).level]));

    // Suggest tasks from incomplete goals (prioritize habits)
    const habits = state.habits.filter(h => !h.isFormed);
    const suggested = habits.slice(0, 3);

    return { levels, todayGains: gains, actionsToday: today, suggestedTasks: suggested };
  }, [state.ledger, state.habits]);

  if (!hydrated) return <div className="min-h-screen bg-bg" />;
  if (!state.setupDone) return <OnboardingSimple />;

  return (
    <main className="min-h-screen bg-bg text-text1">
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="text-[11px] tracking-[0.22em] font-bold text-text3">WHEEL OF LIFE</div>
        <div className="text-sm italic text-text2 max-w-[40vw] truncate">
          {state.profile.northStar || state.profile.purpose || "Your north star"}
        </div>
        <button onClick={() => setShowSettings(true)} className="text-text2 hover:text-text1 text-lg" title="Settings">
          ⚙
        </button>
      </header>

      {/* TODAY'S SUGGESTED ACTIONS */}
      {suggestedTasks.length > 0 && (
        <div className="px-3 pt-3 pb-2 border-b border-white/5">
          <h2 className="text-xs font-bold text-text3 uppercase tracking-wider mb-2">What&apos;s Next Today?</h2>
          <div className="flex gap-2 flex-wrap">
            {suggestedTasks.map((habit) => (
              <button
                key={habit.id}
                onClick={() => {
                  setSelectedHabitForWorkout(habit.id);
                  setShowWorkoutLogger(true);
                }}
                className="px-3 py-1.5 bg-panel2 hover:bg-panel border border-white/10 rounded-lg text-xs font-semibold text-text1 transition"
              >
                {habit.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 px-3 py-3 lg:grid-cols-[280px_1fr_320px]" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* LEFT: ACCOMPLISHED */}
        <div className="order-2 lg:order-1 min-h-[300px] overflow-y-auto">
          <AccomplishedRail />
        </div>

        {/* CENTER: WHEEL */}
        <div className="order-1 lg:order-2 min-h-[400px] flex items-center justify-center">
          <WheelCanvas
            sections={state.sections}
            levels={levels}
            todayGains={todayGains}
            rotationSpeed={rotationSpeed(actionsToday)}
            onSelect={setSelected}
          />
        </div>

        {/* RIGHT: BUDDIES + IN PLAY */}
        <div className="order-3 min-h-[300px] space-y-3">
          <BuddyFeed />
          <div className="border-t border-white/10 pt-3">
            <InPlayRail onToast={setToast} />
          </div>
        </div>
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {selected && <SectionSheet section={selected} onClose={() => setSelected(null)} />}
      {showWorkoutLogger && selectedHabitForWorkout && (
        <WorkoutLogger
          habitId={selectedHabitForWorkout}
          onClose={() => {
            setShowWorkoutLogger(false);
            setSelectedHabitForWorkout(null);
            setToast("Great work! 🔥");
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-panel border border-white/10 rounded-full px-4 py-2 text-sm shadow-xl">
          ✨ {toast}
        </div>
      )}
    </main>
  );
}

function SectionSheet({ section, onClose }: { section: Section; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const live = state.sections.find((s) => s.id === section.id) ?? section;
  const [asp, setAsp] = useState(live.aspiration);
  const [asp2, setAsp2] = useState(live.aspiration2);
  const goals = state.goals.filter((g) => g.sectionId === live.id && !g.isAchieved);
  const tasks = state.tasks.filter((t) => t.sectionId === live.id && !t.isDone);
  const habits = state.habits.filter((h) => h.sectionId === live.id && !h.isFormed);

  return (
    <Modal title={live.name} onClose={onClose}>
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full" style={{ background: live.colorHex }} />
        <span className="text-3xl font-black">{Math.round(live.currentScore)}</span>
        <span className="text-xs text-text3">momentum · decays {live.decayPerDay}/day when neglected</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <label className="text-xs text-text3">
          Rim word (what this area grows toward)
          <input value={asp} onChange={(e) => setAsp(e.target.value)} className="mt-1 w-full bg-panel2 text-sm rounded-md px-3 py-2 border border-white/10" />
        </label>
        <label className="text-xs text-text3">
          Beyond the rim
          <input value={asp2} onChange={(e) => setAsp2(e.target.value)} className="mt-1 w-full bg-panel2 text-sm rounded-md px-3 py-2 border border-white/10" />
        </label>
      </div>
      <div className="mt-4 text-xs text-text2 space-y-1">
        <p>{goals.length} open goals · {tasks.length} open tasks · {habits.length} forming habits</p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="text-sm text-text2 px-3 py-1.5">Cancel</button>
        <button
          onClick={() => {
            dispatch({ type: "setAspiration", id: live.id, aspiration: asp.trim(), aspiration2: asp2.trim() });
            onClose();
          }}
          className="text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-md px-4 py-1.5"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
