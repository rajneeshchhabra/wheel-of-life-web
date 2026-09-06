"use client";

import { useState } from "react";
import type { Section, AppState } from "@/lib/types";

type TabType = "goals" | "tasks" | "habits" | "leave-behind";

interface SectionPanelProps {
  section: Section;
  state: AppState;
  onAddGoal?: (sectionId: string, title: string) => void;
  onCompleteGoal?: (goalId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onAddHabit?: (sectionId: string, title: string) => void;
  onCheckInHabit?: (habitId: string) => void;
}

export default function SectionPanel({
  section,
  state,
  onAddGoal,
  onCompleteGoal,
  onCompleteTask,
  onAddHabit,
  onCheckInHabit,
}: SectionPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("goals");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newHabitTitle, setNewHabitTitle] = useState("");

  const goals = state.goals.filter((g) => g.sectionId === section.id);
  const tasks = state.tasks.filter((t) => t.sectionId === section.id && !t.goalId);
  const habits = state.habits.filter((h) => h.sectionId === section.id);
  const leaveBehind = state.leaveBehind;

  return (
    <div className="flex flex-col h-full bg-panel rounded-lg border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{section.icon}</span>
          <h2 className="text-lg font-bold text-text1">{section.name}</h2>
        </div>
        <p className="text-xs text-text3 italic hover:text-text2 cursor-help" title="Section-specific north star">
          💫 {section.northStar}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-2">
        {(["goals", "tasks", "habits", "leave-behind"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === tab
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-text3 hover:text-text2"
            }`}
          >
            {tab === "goals" && "📍 Goals"}
            {tab === "tasks" && "✓ Tasks"}
            {tab === "habits" && "↻ Habits"}
            {tab === "leave-behind" && "🚫 Leave"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* GOALS */}
        {activeTab === "goals" && (
          <>
            {goals.length === 0 ? (
              <p className="text-xs text-text3">No goals yet. Add one below!</p>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="bg-panel2 rounded p-2 text-sm">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => onCompleteGoal?.(goal.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition ${
                        goal.isAchieved
                          ? "bg-green-500/20 border-green-400"
                          : "border-white/20 hover:border-green-400"
                      }`}
                    >
                      {goal.isAchieved && "✓"}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={goal.isAchieved ? "line-through text-text3" : "text-text1"}>
                        {goal.title}
                      </p>
                      <p className="text-xs text-text3">+{goal.points}pt</p>
                    </div>
                  </div>
                  {/* Tasks under this goal */}
                  {state.tasks
                    .filter((t) => t.goalId === goal.id)
                    .map((task) => (
                      <div key={task.id} className="ml-6 mt-2 bg-panel rounded p-1.5 text-xs">
                        <button
                          onClick={() => onCompleteTask?.(task.id)}
                          className={`flex items-center gap-1 w-full ${
                            task.isDone ? "line-through text-text3" : "text-text2"
                          }`}
                        >
                          <input type="checkbox" checked={task.isDone} readOnly />
                          {task.title}
                        </button>
                      </div>
                    ))}
                </div>
              ))
            )}
            <div className="flex gap-1">
              <input
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="New goal..."
                className="flex-1 bg-panel2 text-xs rounded px-2 py-1 border border-white/10"
              />
              <button
                onClick={() => {
                  if (newGoalTitle.trim()) {
                    onAddGoal?.(section.id, newGoalTitle);
                    setNewGoalTitle("");
                  }
                }}
                className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold px-2 py-1 rounded"
              >
                Add
              </button>
            </div>
          </>
        )}

        {/* TASKS */}
        {activeTab === "tasks" && (
          <>
            {tasks.length === 0 ? (
              <p className="text-xs text-text3">No standalone tasks. Add from a goal!</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => onCompleteTask?.(task.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      task.isDone
                        ? "bg-green-500/20 border-green-400"
                        : "border-white/20 hover:border-green-400"
                    }`}
                  >
                    {task.isDone && "✓"}
                  </button>
                  <span className={task.isDone ? "line-through text-text3" : "text-text1"}>
                    {task.title}
                  </span>
                </div>
              ))
            )}
          </>
        )}

        {/* HABITS */}
        {activeTab === "habits" && (
          <>
            {habits.length === 0 ? (
              <p className="text-xs text-text3">No habits yet. Start building one!</p>
            ) : (
              habits.map((habit) => (
                <div key={habit.id} className="bg-panel2 rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text1 font-semibold">{habit.title}</span>
                    <button
                      onClick={() => onCheckInHabit?.(habit.id)}
                      className="bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-300 px-2 py-1 rounded text-xs font-semibold"
                    >
                      Check in
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-text3">
                    <div className="flex-1 h-1.5 bg-panel rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(habit.streak / habit.targetStreak) * 100}%`,
                        }}
                      />
                    </div>
                    <span>{habit.streak}/{habit.targetStreak} days</span>
                  </div>
                  {habit.isFormed && <p className="mt-1 text-xs text-green-400">✓ Habit formed!</p>}
                </div>
              ))
            )}
            <div className="flex gap-1">
              <input
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="New habit..."
                className="flex-1 bg-panel2 text-xs rounded px-2 py-1 border border-white/10"
              />
              <button
                onClick={() => {
                  if (newHabitTitle.trim()) {
                    onAddHabit?.(section.id, newHabitTitle);
                    setNewHabitTitle("");
                  }
                }}
                className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold px-2 py-1 rounded"
              >
                Add
              </button>
            </div>
          </>
        )}

        {/* LEAVE BEHIND */}
        {activeTab === "leave-behind" && (
          <>
            {leaveBehind.length === 0 ? (
              <p className="text-xs text-text3">Nothing to leave behind yet.</p>
            ) : (
              leaveBehind.map((item) => (
                <div key={item.id} className="bg-panel2 rounded p-2 text-sm">
                  <p className="font-semibold text-text1">{item.name}</p>
                  <p className="text-xs text-text3 mt-1">{item.note}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
