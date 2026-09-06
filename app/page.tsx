"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { todayKey, useStore } from "@/lib/store";
import { equilibrium, levelFor, rotationSpeed } from "@/lib/scoring";
import WheelCanvas from "@/components/WheelCanvas";
import { AccomplishedRail, LeaveBehindPicker, Modal } from "@/components/Rails";
import Settings from "@/components/Settings";
import OnboardingSimple from "@/components/OnboardingSimple";
import BuddyFeed from "@/components/BuddyFeed";
import type { Section } from "@/lib/types";

type Tab = "tasks" | "habits" | "goals" | "leave";
const labels: Record<Tab, string> = { tasks: "Tasks", habits: "Habits", goals: "Goals", leave: "Leave behind" };

export default function Dashboard() {
  const { state, hydrated, storageError, canUndo, undo } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [overview, setOverview] = useState(false);
  const [paused, setPaused] = useState(false);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(380);
  const active = state.sections.filter(s => s.enabled);
  const selected = active.find(s => s.id === selectedId) ?? active[0];
  const editing = state.sections.find(s => s.id === editingId);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 4000); return () => clearTimeout(timer); }, [toast]);
  const { levels, gains, actionsToday } = useMemo(() => {
    const totals: Record<string, number> = {}, gains: Record<string, number> = {};
    let actionsToday = 0;
    for (const e of state.ledger) {
      totals[e.sectionId] = (totals[e.sectionId] ?? 0) + e.points;
      if (todayKey(new Date(e.timestamp)) === todayKey()) {
        gains[e.sectionId] = (gains[e.sectionId] ?? 0) + e.points;
        actionsToday++;
      }
    }
    return { levels: Object.fromEntries(Object.entries(totals).map(([id, points]) => [id, levelFor(points).level])), gains, actionsToday };
  }, [state.ledger]);
  if (!hydrated) return <main className="p-8">Loading your wheel…</main>;
  if (storageError && !state.setupDone) return <main className="p-8" role="alert">{storageError}</main>;
  if (!state.setupDone) return <OnboardingSimple />;
  const avg = active.length ? Math.round(active.reduce((sum, s) => sum + s.currentScore, 0) / active.length) : 0;
  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div><p className="eyebrow">WHEEL OF LIFE</p><h1>{state.profile.northStar || state.profile.purpose || "A consequential life"}</h1></div>
        <div className="flex items-center gap-2">
          {canUndo && <button className="quiet-button" onClick={() => { undo(); setToast("Last completion undone"); }}>Undo completion</button>}
          <button className="quiet-button" onClick={() => setShowSettings(true)}>Settings</button>
        </div>
      </header>
      {storageError && <p role="alert" className="p-4 text-amber-300">{storageError}</p>}
      <div className="dashboard-stats">
        <span><b>{actionsToday}</b> actions today</span><span><b>{avg}/100</b> momentum</span>
        <span title="How evenly momentum is distributed. Equal scores mean balance, including when every score is zero."><b>{active.length ? equilibrium(active.map(s => s.currentScore)) : "—"}/100</b> balance</span>
        <span><b>{active.length}</b> active areas</span>
      </div>
      <div className="dashboard-grid" style={{ "--left-width": `${leftWidth}px`, "--right-width": `${rightWidth}px` } as CSSProperties}>
        <aside className="dashboard-left space-y-4">
          <TodayFocus onSelect={setSelectedId} onToast={setToast} />
          <div className="accomplished-wrap"><AccomplishedRail /></div>
          <BuddyFeed />
          <label className="column-size">Panel width<input aria-label="Left panel width" type="range" min="240" max="340" value={leftWidth} onChange={e => setLeftWidth(Number(e.target.value))} /></label>
        </aside>
        <section className="wheel-panel">
          <div className="panel-heading"><div><p className="eyebrow">THE BIG PICTURE</p><h2>{overview ? "Your life areas" : "Your living wheel"}</h2></div>
            <button className="quiet-button" aria-pressed={overview} onClick={() => setOverview(!overview)}>{overview ? "Show wheel" : "Overview"}</button>
          </div>
          {overview ? <div className="area-grid">{active.map(s => {
            const tasks = state.tasks.filter(t => t.sectionId === s.id && !t.isDone);
            const habits = state.habits.filter(h => h.sectionId === s.id && h.lastCheckIn !== todayKey());
            return <button key={s.id} className={`area-card ${selected?.id === s.id ? "selected" : ""}`} onClick={() => setSelectedId(s.id)}>
              <div className="flex justify-between gap-2"><h3><span style={{ color: s.colorHex }}>●</span> {s.name}</h3><b>{Math.round(s.currentScore)}</b></div>
              <p>{s.northStar || "Set a north star for this area"}</p><Bricks section={s} />
              <p>{tasks.length} open tasks · {habits.length} habits to do</p>
              <span className="text-text1">{tasks[0]?.title || habits[0]?.title || "Open area to choose your next step"} →</span>
            </button>;
          })}</div> : <>
            <div className="wheel-stage"><WheelCanvas sections={active} levels={levels} todayGains={gains} rotationSpeed={paused ? 0 : rotationSpeed(actionsToday)} onSelect={s => setSelectedId(s.id)} /></div>
            <div className="wheel-caption"><span>Daily actions build momentum. Completed milestones light bricks.</span><button className="quiet-button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume motion" : "Pause motion"}</button></div>
          </>}
          {!active.length && <p className="p-6">Enable a life area in Settings to start.</p>}
          <nav className="area-selector" aria-label="Select a life area">{active.map(s => <button key={s.id} aria-pressed={selected?.id === s.id} onClick={() => setSelectedId(s.id)}><span style={{ color: s.colorHex }}>●</span> {s.name}</button>)}</nav>
        </section>
        <aside className="detail-panel">
          {selected ? <SectionDetail key={selected.id} section={selected} onEdit={() => setEditingId(selected.id)} onToast={setToast} /> : <p className="p-6">Your selected area will appear here.</p>}
          <label className="column-size">Panel width<input aria-label="Right panel width" type="range" min="340" max="460" value={rightWidth} onChange={e => setRightWidth(Number(e.target.value))} /></label>
        </aside>
      </div>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {editing && <SectionEditor key={editing.id} section={editing} onClose={() => setEditingId(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function TodayFocus({ onSelect, onToast }: { onSelect: (id: string) => void; onToast: (message: string) => void }) {
  const { state, dispatch } = useStore();
  const enabled = new Set(state.sections.filter(s => s.enabled).map(s => s.id));
  const items = [
    ...state.tasks.filter(t => !t.isDone && enabled.has(t.sectionId)).map(t => ({ ...t, kind: "task" as const })),
    ...state.habits.filter(h => h.lastCheckIn !== todayKey() && enabled.has(h.sectionId)).map(h => ({ ...h, kind: "habit" as const })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, 5);
  return <section className="focus-panel"><p className="eyebrow">MAKE TODAY COUNT</p><h2>Your next five</h2><p className="supporting">Open tasks and daily habits, oldest first.</p>
    {items.length ? items.map(item => <div className="focus-item" key={item.id}>
      <button className="check-button" aria-label={`Complete ${item.title}`} onClick={() => { dispatch({ type: item.kind === "task" ? "completeTask" : "checkInHabit", id: item.id }); onToast("Progress saved"); }}>○</button>
      <button className="text-left min-w-0" onClick={() => onSelect(item.sectionId)}><span className="block">{item.title}</span><small>{state.sections.find(s => s.id === item.sectionId)?.name} · {item.kind}</small></button>
    </div>) : <p className="empty-state">No open daily actions. Choose an area and add a task or habit.</p>}
  </section>;
}

function Bricks({ section }: { section: Section }) {
  return <div className="brick-progress"><div className="brick-track" aria-label={`${section.bricksLit} of ${section.brickCount} milestones completed`}>{Array.from({ length: section.brickCount }, (_, i) => <i key={i} style={{ background: i < section.bricksLit ? section.colorHex : undefined }} />)}</div><small>{section.bricksLit}/{section.brickCount} bricks · goals, tasks and formed habits</small></div>;
}

function SectionDetail({ section, onEdit, onToast }: { section: Section; onEdit: () => void; onToast: (message: string) => void }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<Tab>("tasks");
  const [title, setTitle] = useState("");
  const [catalog, setCatalog] = useState(false);
  const tasks = state.tasks.filter(t => t.sectionId === section.id);
  const goals = state.goals.filter(g => g.sectionId === section.id);
  const habits = state.habits.filter(h => h.sectionId === section.id);
  const counts = { tasks: tasks.filter(t => !t.isDone).length, goals: goals.filter(g => !g.isAchieved).length, habits: habits.filter(h => h.lastCheckIn !== todayKey()).length, leave: state.leaveBehind.length };
  const rows = tab === "tasks" ? tasks.map(t => ({ id: t.id, title: t.title, done: t.isDone, note: `+${t.points} base points`, action: "completeTask" as const })) : tab === "goals" ? goals.map(g => ({ id: g.id, title: g.title, done: g.isAchieved, note: `+${g.points} base points`, action: "achieveGoal" as const })) : habits.map(h => ({ id: h.id, title: h.title, done: h.lastCheckIn === todayKey(), note: `${h.streak}/${h.targetStreak} day streak${h.isFormed ? " · Formed" : ""}`, action: "checkInHabit" as const }));
  const add = () => {
    if (!title.trim()) return;
    if (tab === "leave") dispatch({ type: "addLeaveBehind", items: [{ name: title.trim(), note: "" }] });
    else dispatch({ type: tab === "tasks" ? "addTask" : tab === "goals" ? "addGoal" : "addHabit", sectionId: section.id, title: title.trim() });
    setTitle(""); onToast("Added");
  };
  return <div className="section-detail">
    <div className="panel-heading"><div><p className="eyebrow">IN PLAY</p><h2><span style={{ color: section.colorHex }}>●</span> {section.name}</h2></div><button className="quiet-button" onClick={onEdit}>Edit area</button></div>
    <p className="north-star">{section.northStar || "What does a fulfilling life in this area look like?"}</p>
    <div className="momentum"><b>{Math.round(section.currentScore)}<small>/100</small></b><span>momentum</span></div>
    <Bricks section={section} />
    <div className="detail-tabs" role="tablist" aria-label="Area items">{(Object.keys(labels) as Tab[]).map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setTitle(""); }}>{labels[t]} <small>{counts[t]}</small></button>)}</div>
    <form className="add-form" onSubmit={e => { e.preventDefault(); add(); }}><input aria-label={`New ${labels[tab].toLowerCase()} item`} value={title} onChange={e => setTitle(e.target.value)} placeholder={tab === "tasks" ? "What's the next concrete step?" : tab === "habits" ? "A small action to repeat daily" : tab === "goals" ? "An outcome worth working toward" : "A pattern to leave behind"} /><button className="primary-button" disabled={!title.trim()}>Add</button></form>
    <div className="item-list" role="tabpanel" aria-label={labels[tab]}>{tab === "leave" ? <>
      <p className="supporting">Personal patterns across all your life areas.</p><button className="quiet-button" onClick={() => setCatalog(true)}>Choose from suggestions</button>
      {state.leaveBehind.map(item => <div className="action-item" key={item.id}><div className="flex-1"><p>{item.name}</p><small>{item.note}</small></div><button className="quiet-button" aria-label={`Remove ${item.name}`} onClick={() => dispatch({ type: "removeLeaveBehind", id: item.id })}>Remove</button></div>)}
    </> : rows.length ? [...rows].sort((a,b) => Number(a.done) - Number(b.done)).map(item => <div className={`action-item ${item.done ? "is-done" : ""}`} key={item.id}>
      <button className="check-button" disabled={item.done} aria-label={`${item.done ? "Completed" : "Complete"} ${item.title}`} onClick={() => { dispatch({ type: item.action, id: item.id }); onToast(tab === "habits" ? "Habit checked in for today" : "Completed — progress saved"); }}>{item.done ? "✓" : "○"}</button>
      <div className="flex-1 min-w-0"><p>{item.title}</p><small>{item.done ? tab === "habits" ? "Done today · " + item.note : "Completed" : item.note}</small></div>
    </div>) : <p className="empty-state">{tab === "tasks" ? "Break a goal into one doable next step." : tab === "habits" ? "Build the daily foundations that support your goals." : "Define the outcomes you want to achieve."}</p>}</div>
    {catalog && <LeaveBehindPicker onClose={() => setCatalog(false)} />}
  </div>;
}

function SectionEditor({ section, onClose }: { section: Section; onClose: () => void }) {
  const { dispatch } = useStore();
  const [northStar, setNorthStar] = useState(section.northStar);
  const [aspiration, setAspiration] = useState(section.aspiration);
  const [aspiration2, setAspiration2] = useState(section.aspiration2);
  return <Modal title={`Edit ${section.name}`} onClose={onClose}><form onSubmit={e => { e.preventDefault(); dispatch({ type: "setAspiration", id: section.id, northStar: northStar.trim(), aspiration: aspiration.trim(), aspiration2: aspiration2.trim() }); onClose(); }} className="editor-form">
    <label>North star<textarea value={northStar} onChange={e => setNorthStar(e.target.value)} placeholder="What are you working toward in this area?" /></label>
    <label>Wheel rim word<input value={aspiration} maxLength={24} onChange={e => setAspiration(e.target.value)} /></label>
    <label>Beyond the rim<input value={aspiration2} maxLength={24} onChange={e => setAspiration2(e.target.value)} /></label>
    <div className="flex justify-end gap-2"><button type="button" className="quiet-button" onClick={onClose}>Cancel</button><button className="primary-button">Save changes</button></div>
  </form></Modal>;
}
