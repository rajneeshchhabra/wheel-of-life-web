"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { AccomplishedRail } from "@/components/Rails";
import Settings from "@/components/Settings";
import OnboardingSimple from "@/components/OnboardingSimple";
import RadialWheel from "@/components/RadialWheel";
import SectionPanel from "@/components/SectionPanel";
import type { Section } from "@/lib/types";

export default function Dashboard() {
  const { state, dispatch, hydrated } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  if (!hydrated) return <div className="min-h-screen bg-bg" />;
  if (!state.setupDone) return <OnboardingSimple />;

  return (
    <main className="min-h-screen bg-bg text-text1 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5 h-16">
        <div className="text-[11px] tracking-[0.22em] font-bold text-text3">🎡 WHEEL OF LIFE</div>
        <div className="text-sm italic text-text2 max-w-[40vw] truncate">
          {state.profile.northStar || state.profile.purpose || "Your north star"}
        </div>
        <button onClick={() => setShowSettings(true)} className="text-text2 hover:text-text1 text-lg" title="Settings">
          ⚙
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-3 px-3 py-3 overflow-hidden">
        {/* LEFT: Accomplished Rail */}
        <div className="w-72 flex-shrink-0 rounded-lg border border-white/10 bg-panel overflow-y-auto">
          <AccomplishedRail />
        </div>

        {/* CENTER: Radial Wheel */}
        <div className="flex-1 flex items-center justify-center rounded-lg border border-white/10 bg-panel">
          <div className="w-full h-full flex items-center justify-center">
            <RadialWheel sections={state.sections} mood={state.mood} onSectionClick={setSelectedSection} />
          </div>
        </div>

        {/* RIGHT: Section Panel (resizable) */}
        <div
          style={{ width: `${rightPanelWidth}px` }}
          className="flex-shrink-0 flex flex-col gap-3 overflow-hidden group"
        >
          {selectedSection ? (
            <SectionPanel
              section={selectedSection}
              state={state}
              onAddGoal={(sectionId, title) => {
                dispatch({ type: "addGoal", sectionId, title });
                setToast("Goal added!");
              }}
              onCompleteGoal={(goalId) => {
                dispatch({ type: "achieveGoal", id: goalId });
                setToast("Goal achieved! 🎉");
              }}
              onCompleteTask={(taskId) => {
                dispatch({ type: "completeTask", id: taskId });
                setToast("Task done! ✓");
              }}
              onAddHabit={(sectionId, title) => {
                dispatch({ type: "addHabit", sectionId, title });
                setToast("Habit started!");
              }}
              onCheckInHabit={(habitId) => {
                dispatch({ type: "checkInHabit", id: habitId });
                setToast("Streak growing! 🔥");
              }}
            />
          ) : (
            <div className="flex-1 rounded-lg border border-white/10 bg-panel flex items-center justify-center">
              <div className="text-center text-text3">
                <div className="text-4xl mb-2">👉</div>
                <p className="text-xs">Click a section on the wheel</p>
                <p className="text-xs text-text3">to see goals, tasks, habits</p>
              </div>
            </div>
          )}

          {/* Resizer */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = rightPanelWidth;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const delta = moveEvent.clientX - startX;
                setRightPanelWidth(Math.max(280, startWidth + delta));
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
            className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-indigo-500/30 transition opacity-0 group-hover:opacity-100"
          />
        </div>
      </div>

      {/* Bottom Activity Log (collapsible) */}
      <div className="border-t border-white/5 bg-panel/50 px-5 py-2 text-xs text-text3">
        📊 Mood: {state.mood.toUpperCase()} • Balance: {Math.round((state.sections.reduce((a, s) => a + s.currentScore, 0) / (state.sections.length * 100)) * 100)}%
      </div>

      {/* Modals */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-panel border border-white/10 rounded-full px-4 py-2 text-sm shadow-xl animate-pulse z-50">
          ✨ {toast}
        </div>
      )}
    </main>
  );
}
