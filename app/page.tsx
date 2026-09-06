"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { levelFor, rotationSpeed } from "@/lib/scoring";
import WheelCanvas from "@/components/WheelCanvas";
import { AccomplishedRail, Modal } from "@/components/Rails";
import Settings from "@/components/Settings";
import OnboardingSimple from "@/components/OnboardingSimple";
import BuddyFeed from "@/components/BuddyFeed";
import WorkoutLogger from "@/components/WorkoutLogger";
import type { Section } from "@/lib/types";

export default function Dashboard() {
  const { state, dispatch, hydrated } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState<Section | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showMasterView, setShowMasterView] = useState(false);
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(340);
  const [showWorkoutLogger, setShowWorkoutLogger] = useState(false);
  const [selectedHabitForWorkout, setSelectedHabitForWorkout] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const { levels, todayGains, actionsToday } = useMemo(() => {
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
    return { levels, todayGains: gains, actionsToday: today };
  }, [state.ledger]);

  if (!hydrated) return <div className="min-h-screen bg-bg" />;
  if (!state.setupDone) return <OnboardingSimple />;

  return (
    <main className="min-h-screen bg-bg text-text1 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="text-[11px] tracking-[0.22em] font-bold text-text3">WHEEL OF LIFE</div>
        <div className="text-sm italic text-text2 max-w-[40vw] truncate">
          {state.profile.northStar || state.profile.purpose || "Your north star"}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMasterView(!showMasterView)}
            className="text-text2 hover:text-text1 text-sm px-2 py-1 hover:bg-white/5 rounded"
            title="View all sections"
          >
            📊
          </button>
          <button onClick={() => setShowSettings(true)} className="text-text2 hover:text-text1 text-lg" title="Settings">
            ⚙
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex flex-1 gap-1 px-3 py-3 overflow-hidden" style={{ minHeight: "calc(100vh - 80px)" }}>
        {/* LEFT COLUMN (Resizable) */}
        <div
          style={{ width: `${leftWidth}px` }}
          className="flex flex-col gap-2 flex-shrink-0 group relative"
        >
          {/* Accomplished Rail */}
          <div className="flex-1 rounded-lg border border-white/10 bg-panel overflow-y-auto">
            <AccomplishedRail />
          </div>

          {/* Buddy Feed (Bottom) */}
          <div className="h-48 rounded-lg border border-white/10 bg-panel overflow-y-auto p-3">
            <BuddyFeed />
          </div>

          {/* Left Resizer */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = leftWidth;
              const handleMouseMove = (moveEvent: MouseEvent) => {
                setLeftWidth(Math.max(200, startWidth + moveEvent.clientX - startX));
              };
              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };
              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
            className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-indigo-500/30 transition opacity-0 group-hover:opacity-100"
          />
        </div>

        {/* CENTER (Wheel) */}
        <div className="flex-1 rounded-lg border border-white/10 bg-panel flex items-center justify-center overflow-hidden">
          {showMasterView ? (
            <div className="w-full h-full p-6 overflow-y-auto">
              <h2 className="text-lg font-bold text-text1 mb-4">All Sections Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                {state.sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => {
                      setSelected(section);
                      setShowMasterView(false);
                    }}
                    className="bg-panel2 rounded-lg p-4 border border-white/10 cursor-pointer hover:border-indigo-400 transition"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{section.icon}</span>
                      <div>
                        <h3 className="font-bold text-text1">{section.name}</h3>
                        <p className="text-xs text-text3">{section.northStar}</p>
                      </div>
                    </div>
                    <div className="text-sm text-text2">
                      <p>Score: {Math.round(section.currentScore)}</p>
                      <p>Bricks: {section.bricksLit}/{section.brickCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <WheelCanvas
              sections={state.sections}
              levels={levels}
              todayGains={todayGains}
              rotationSpeed={rotationSpeed(actionsToday)}
              onSelect={setSelected}
            />
          )}
        </div>

        {/* RIGHT COLUMN (Resizable) */}
        <div
          style={{ width: `${rightWidth}px` }}
          className="flex-shrink-0 rounded-lg border border-white/10 bg-panel overflow-y-auto group relative"
        >
          {selected ? (
            <SectionDetailView section={selected} state={state} dispatch={dispatch} onToast={setToast} />
          ) : (
            <div className="h-full flex items-center justify-center text-text3 text-center p-4">
              <div>
                <div className="text-4xl mb-2">👉</div>
                <p className="text-sm">Click a section on the wheel</p>
                <p className="text-xs">to see details</p>
              </div>
            </div>
          )}

          {/* Right Resizer */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = rightWidth;
              const handleMouseMove = (moveEvent: MouseEvent) => {
                setRightWidth(Math.max(250, startWidth - (moveEvent.clientX - startX)));
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

      {/* Modals */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {selected && !showMasterView && (
        <SectionSheet section={selected} onClose={() => setSelected(null)} />
      )}
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-panel border border-white/10 rounded-full px-4 py-2 text-sm shadow-xl z-50">
          ✨ {toast}
        </div>
      )}
    </main>
  );
}

function SectionDetailView({
  section,
  state,
  dispatch,
  onToast,
}: {
  section: Section;
  state: ReturnType<typeof useStore>["state"];
  dispatch: ReturnType<typeof useStore>["dispatch"];
  onToast: (msg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"goals" | "tasks" | "habits" | "leave">("goals");
  const [newTitle, setNewTitle] = useState("");

  const goals = state.goals.filter((g) => g.sectionId === section.id);
  const tasks = state.tasks.filter((t) => t.sectionId === section.id);
  const habits = state.habits.filter((h) => h.sectionId === section.id);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{section.icon}</span>
          <h2 className="text-lg font-bold text-text1">{section.name}</h2>
        </div>
        <p className="text-xs text-text3 italic">💫 {section.northStar}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-white/10">
        {(["goals", "tasks", "habits", "leave"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-semibold px-2 py-2 transition ${
              activeTab === tab
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-text3 hover:text-text2"
            }`}
          >
            {tab === "goals" && "📍"}
            {tab === "tasks" && "✓"}
            {tab === "habits" && "↻"}
            {tab === "leave" && "🚫"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {activeTab === "goals" &&
          goals.map((g) => (
            <div key={g.id} className="bg-panel2 rounded p-2 text-sm">
              <button
                onClick={() => {
                  dispatch({ type: "achieveGoal", id: g.id });
                  onToast("Goal achieved! 🎉");
                }}
                className={`w-full text-left ${g.isAchieved ? "line-through text-text3" : "text-text1"}`}
              >
                {g.isAchieved ? "✓" : "○"} {g.title}
              </button>
            </div>
          ))}

        {activeTab === "tasks" &&
          tasks.map((t) => (
            <div key={t.id} className="bg-panel2 rounded p-2 text-sm">
              <button
                onClick={() => {
                  dispatch({ type: "completeTask", id: t.id });
                  onToast("Task done! ✓");
                }}
                className={`w-full text-left ${t.isDone ? "line-through text-text3" : "text-text1"}`}
              >
                {t.isDone ? "✓" : "○"} {t.title}
              </button>
            </div>
          ))}

        {activeTab === "habits" &&
          habits.map((h) => (
            <div key={h.id} className="bg-panel2 rounded p-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{h.title}</span>
                <button
                  onClick={() => {
                    dispatch({ type: "checkInHabit", id: h.id });
                    onToast("Streak! 🔥");
                  }}
                  className="text-xs bg-indigo-500/30 px-2 py-1 rounded hover:bg-indigo-500/50"
                >
                  {h.streak}/{h.targetStreak}
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Add */}
      <div className="flex gap-2 border-t border-white/10 pt-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={`Add ${activeTab}...`}
          className="flex-1 bg-panel2 text-xs px-2 py-1.5 rounded border border-white/10"
        />
        <button
          onClick={() => {
            if (newTitle.trim()) {
              if (activeTab === "goals") dispatch({ type: "addGoal", sectionId: section.id, title: newTitle });
              if (activeTab === "tasks") dispatch({ type: "addTask", sectionId: section.id, title: newTitle });
              if (activeTab === "habits") dispatch({ type: "addHabit", sectionId: section.id, title: newTitle });
              setNewTitle("");
            }
          }}
          className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold px-3 py-1.5 rounded"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function SectionSheet({ section, onClose }: { section: Section; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const live = state.sections.find((s) => s.id === section.id) ?? section;
  const [asp, setAsp] = useState(live.aspiration);
  const [asp2, setAsp2] = useState(live.aspiration2);

  return (
    <Modal title={live.name} onClose={onClose}>
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full" style={{ background: live.colorHex }} />
        <span className="text-3xl font-black">{Math.round(live.currentScore)}</span>
        <span className="text-xs text-text3">momentum · bricks lit: {live.bricksLit}/{live.brickCount}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <label className="text-xs text-text3">
          Rim word
          <input
            value={asp}
            onChange={(e) => setAsp(e.target.value)}
            className="mt-1 w-full bg-panel2 text-sm rounded-md px-3 py-2 border border-white/10"
          />
        </label>
        <label className="text-xs text-text3">
          Beyond rim
          <input
            value={asp2}
            onChange={(e) => setAsp2(e.target.value)}
            className="mt-1 w-full bg-panel2 text-sm rounded-md px-3 py-2 border border-white/10"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="text-sm text-text2 px-3 py-1.5">
          Cancel
        </button>
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
