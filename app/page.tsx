"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { levelFor, rotationSpeed } from "@/lib/scoring";
import WheelCanvas from "@/components/WheelCanvas";
import { AccomplishedRail, InPlayRail, Modal } from "@/components/Rails";
import Settings from "@/components/Settings";
import OnboardingSimple from "@/components/OnboardingSimple";
import BuddyFeed from "@/components/BuddyFeed";
import type { Section } from "@/lib/types";

export default function Dashboard() {
  const { state, dispatch, hydrated } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState<Section | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
    <main className="min-h-screen bg-bg text-text1">
      <header className="flex items-center justify-between px-5 py-3">
        <div className="text-[11px] tracking-[0.22em] font-bold text-text3">WHEEL OF LIFE</div>
        <button
          onClick={() => dispatch({ type: "setPurpose", purpose: prompt("What is it all for?", state.profile.purpose) ?? state.profile.purpose })}
          className="text-sm italic text-text2 hover:text-text1 max-w-[60vw] truncate"
          title="Click to edit your purpose"
        >
          {state.profile.purpose || "Set your purpose — what is it all for?"}
        </button>
        <button onClick={() => setShowSettings(true)} className="text-text2 hover:text-text1 text-lg" title="Settings">
          ⚙
        </button>
      </header>

      <div className="grid gap-3 px-3 pb-3 lg:grid-cols-[300px_1fr_380px]" style={{ minHeight: "calc(100vh - 56px)" }}>
        <div className="order-2 lg:order-1 min-h-[300px]">
          <AccomplishedRail />
        </div>
        <div className="order-1 lg:order-2 min-h-[520px] aspect-square lg:aspect-auto">
          <WheelCanvas
            sections={state.sections}
            levels={levels}
            todayGains={todayGains}
            rotationSpeed={rotationSpeed(actionsToday)}
            onSelect={setSelected}
          />
        </div>
        <div className="order-3 min-h-[300px]">
          <InPlayRail onToast={setToast} />
        </div>
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {selected && <SectionSheet section={selected} onClose={() => setSelected(null)} />}

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
