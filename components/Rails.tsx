"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { Section } from "@/lib/types";
import { LEAVE_BEHIND_CATALOG } from "@/lib/catalog";

type Tab = "goals" | "tasks" | "habits" | "leave";

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "goals", label: "Goals", icon: "◎" },
  { id: "tasks", label: "Tasks", icon: "✓" },
  { id: "habits", label: "Habits", icon: "↻" },
  { id: "leave", label: "Leave Behind", icon: "⊘" },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function InPlayRail({ onToast }: { onToast: (msg: string) => void }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<Tab>("goals");
  const active = state.sections.filter((s) => s.enabled);
  const [sectionId, setSectionId] = useState(active[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);

  const counts: Record<Tab, number> = {
    goals: state.goals.filter((g) => !g.isAchieved).length,
    tasks: state.tasks.filter((t) => !t.isDone).length,
    habits: state.habits.filter((h) => !h.isFormed).length,
    leave: state.leaveBehind.length,
  };

  const selectedSection = active.find((s) => s.id === sectionId) ?? active[0];

  const add = () => {
    const t = title.trim();
    if (!t || !selectedSection) return;
    if (tab === "goals") dispatch({ type: "addGoal", sectionId: selectedSection.id, title: t });
    if (tab === "tasks") dispatch({ type: "addTask", sectionId: selectedSection.id, title: t });
    if (tab === "habits") dispatch({ type: "addHabit", sectionId: selectedSection.id, title: t });
    setTitle("");
  };

  return (
    <Rail title="IN PLAY" hint="Everything alive. Click a row to mark it done — points land on the wheel.">
      <Tabs tabs={TABS} current={tab} counts={counts} onChange={setTab} />

      {tab !== "leave" ? (
        <>
          <div className="flex gap-2 mt-3">
            <select
              value={selectedSection?.id ?? ""}
              onChange={(e) => setSectionId(e.target.value)}
              className="bg-panel2 text-xs rounded-md px-2 py-2 border border-white/10 text-text2"
            >
              {active.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder={`Add ${tab === "goals" ? "a goal" : tab === "tasks" ? "a task" : "a habit"} — press Return`}
              className="flex-1 bg-panel2 text-sm rounded-md px-3 py-2 border border-white/10 placeholder:text-text3 focus:outline-none focus:border-indigo-400/60"
            />
          </div>

          <div className="mt-3 space-y-1.5">
            {tab === "goals" &&
              state.goals
                .filter((g) => !g.isAchieved)
                .map((g) => (
                  <Row
                    key={g.id}
                    color={colorOf(state.sections, g.sectionId)}
                    title={g.title}
                    sub={`${sectionName(state.sections, g.sectionId)} · +${g.points} when achieved`}
                    onClick={() => {
                      dispatch({ type: "achieveGoal", id: g.id });
                      onToast(`Goal achieved: ${g.title}`);
                    }}
                    onDelete={() => dispatch({ type: "delete", kind: "goal", id: g.id })}
                  />
                ))}
            {tab === "tasks" &&
              state.tasks
                .filter((t) => !t.isDone)
                .map((t) => (
                  <Row
                    key={t.id}
                    color={colorOf(state.sections, t.sectionId)}
                    title={t.title}
                    sub={`${sectionName(state.sections, t.sectionId)} · +${t.points}`}
                    onClick={() => {
                      dispatch({ type: "completeTask", id: t.id });
                      onToast(`Done: ${t.title}`);
                    }}
                    onDelete={() => dispatch({ type: "delete", kind: "task", id: t.id })}
                  />
                ))}
            {tab === "habits" &&
              state.habits
                .filter((h) => !h.isFormed)
                .map((h) => {
                  const checked = h.lastCheckIn === todayKey();
                  return (
                    <Row
                      key={h.id}
                      color={colorOf(state.sections, h.sectionId)}
                      title={h.title}
                      sub={`${sectionName(state.sections, h.sectionId)} · streak ${h.streak}/${h.targetStreak}${checked ? " · done today" : ""}`}
                      dim={checked}
                      onClick={() => {
                        if (checked) return;
                        dispatch({ type: "checkInHabit", id: h.id });
                        onToast(`Checked in: ${h.title}`);
                      }}
                      onDelete={() => dispatch({ type: "delete", kind: "habit", id: h.id })}
                    />
                  );
                })}
            {counts[tab] === 0 && (
              <p className="text-xs text-text3 px-1 py-3">
                {tab === "goals" && "The why. Everything serves a goal."}
                {tab === "tasks" && "Every action, one line at a time."}
                {tab === "habits" && "Done daily. Hit the streak and it graduates."}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="mt-3">
          <div className="rounded-lg border border-red-400/20 bg-red-500/5 p-3">
            <p className="text-[13px] font-semibold text-red-300">Nothing changes unless you do too.</p>
            <p className="text-xs text-text2 mt-1">
              There are things you know don&apos;t serve you — they get in the way. Name them, and let them go.
            </p>
            <button
              onClick={() => setShowCatalog(true)}
              className="mt-3 text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 text-red-200 rounded-md px-3 py-1.5 border border-red-400/20"
            >
              ⊘ Choose what to leave behind
            </button>
          </div>
          <div className="mt-3 space-y-1.5">
            {state.leaveBehind.map((l) => (
              <div
                key={l.id}
                className="group flex items-start gap-3 rounded-lg border border-red-400/15 bg-red-500/[0.06] px-3 py-2"
              >
                <span className="text-red-300 text-sm mt-0.5">⊘</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-text1 line-through decoration-red-400/50">{l.name}</p>
                  {l.note && <p className="text-xs text-text3">{l.note}</p>}
                </div>
                <button
                  onClick={() => dispatch({ type: "removeLeaveBehind", id: l.id })}
                  className="opacity-0 group-hover:opacity-100 text-text3 hover:text-red-300 text-xs"
                  title="Released"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {showCatalog && <LeaveBehindPicker onClose={() => setShowCatalog(false)} />}
        </div>
      )}
    </Rail>
  );
}

export function LeaveBehindPicker({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState("");
  const already = new Set(state.leaveBehind.map((l) => l.name));

  const commit = () => {
    const items = LEAVE_BEHIND_CATALOG.filter((c) => selected.has(c.name));
    if (custom.trim()) items.push({ name: custom.trim(), note: "" });
    if (items.length) dispatch({ type: "addLeaveBehind", items });
    onClose();
  };

  return (
    <Modal onClose={onClose} title="What do you want to leave behind?">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {LEAVE_BEHIND_CATALOG.map((c) => {
          const on = selected.has(c.name);
          const taken = already.has(c.name);
          return (
            <button
              key={c.name}
              disabled={taken}
              onClick={() => {
                const next = new Set(selected);
                if (on) next.delete(c.name);
                else next.add(c.name);
                setSelected(next);
              }}
              className={`text-left rounded-lg border px-3 py-2 transition ${
                taken
                  ? "opacity-35 border-white/5"
                  : on
                    ? "border-red-400/50 bg-red-500/15"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <p className="text-[13px] font-semibold text-text1">
                <span className={`mr-2 ${on ? "text-red-300" : "text-text3"}`}>{on ? "⊘" : "○"}</span>
                {c.name}
              </p>
              <p className="text-xs text-text3 ml-5">{c.note}</p>
            </button>
          );
        })}
      </div>
      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="Or name your own…"
        className="mt-3 w-full bg-panel2 text-sm rounded-md px-3 py-2 border border-white/10 placeholder:text-text3 focus:outline-none focus:border-red-400/50"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="text-sm text-text2 px-3 py-1.5">
          Cancel
        </button>
        <button
          onClick={commit}
          disabled={selected.size === 0 && !custom.trim()}
          className="text-sm font-semibold bg-red-500/80 hover:bg-red-500 disabled:opacity-40 text-white rounded-md px-4 py-1.5"
        >
          Let go
        </button>
      </div>
    </Modal>
  );
}

export function AccomplishedRail() {
  const { state } = useStore();
  const items = useMemo(() => {
    const out: Array<{ id: string; title: string; kind: string; when: string; color: string }> = [];
    state.goals.filter((g) => g.isAchieved).forEach((g) =>
      out.push({ id: g.id, title: g.title, kind: "Goal achieved", when: g.achievedAt ?? g.createdAt, color: colorOf(state.sections, g.sectionId) }),
    );
    state.tasks.filter((t) => t.isDone).forEach((t) =>
      out.push({ id: t.id, title: t.title, kind: "Task done", when: t.doneAt ?? t.createdAt, color: colorOf(state.sections, t.sectionId) }),
    );
    state.habits.filter((h) => h.isFormed).forEach((h) =>
      out.push({ id: h.id, title: h.title, kind: "Habit formed", when: h.createdAt, color: colorOf(state.sections, h.sectionId) }),
    );
    return out.sort((a, b) => b.when.localeCompare(a.when));
  }, [state]);

  const totalPoints = state.ledger.reduce((a, e) => a + e.points, 0);

  return (
    <Rail title="ACCOMPLISHED" hint="Earned, not added. Nothing lands here by hand.">
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-black text-text1">{totalPoints}</span>
        <span className="text-[10px] tracking-[0.2em] text-text3 font-semibold">POINTS</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {items.length === 0 && (
          <p className="text-xs text-text3 px-1 py-3">
            Nothing here yet — this column is earned. Achieve a goal, finish a task, form a habit.
          </p>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
            <span className="w-2 h-2 rounded-full" style={{ background: it.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text1 truncate">{it.title}</p>
              <p className="text-[11px] text-text3">
                {it.kind} · {new Date(it.when).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Rail>
  );
}

// ---------- small building blocks ----------

export function Rail({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-panel rounded-2xl border border-white/[0.06] p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <h2 className="text-[11px] tracking-[0.22em] font-bold text-text3">{title}</h2>
        {hint && (
          <span className="text-text3 text-[11px] cursor-help" title={hint}>
            ⓘ
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Tabs<T extends string>({
  tabs,
  current,
  counts,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; icon: string }>;
  current: T;
  counts: Record<T, number>;
  onChange: (t: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {tabs.map((t) => {
        const on = t.id === current;
        const leave = t.id === "leave";
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition ${
              on
                ? leave
                  ? "bg-red-500/20 border-red-400/40 text-red-200"
                  : "bg-white/10 border-white/15 text-text1"
                : "border-transparent text-text2 hover:bg-white/5"
            }`}
          >
            <span className={`mr-1.5 ${leave ? "text-red-300" : ""}`}>{t.icon}</span>
            {t.label}
            {counts[t.id] > 0 && <span className="ml-1.5 text-text3">{counts[t.id]}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Row({
  color,
  title,
  sub,
  dim,
  onClick,
  onDelete,
}: {
  color: string;
  title: string;
  sub: string;
  dim?: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2 cursor-pointer ${dim ? "opacity-50" : ""}`}
      onClick={onClick}
    >
      <span className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text1 truncate">{title}</p>
        <p className="text-[11px] text-text3">{sub}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 text-text3 hover:text-red-300 text-xs px-1"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]'
    ) ?? []);
    (focusable()[0] ?? dialog.current)?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0], last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-panel rounded-2xl border border-white/10 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-base font-bold text-text1 mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function colorOf(sections: Section[], id: string) {
  return sections.find((s) => s.id === id)?.colorHex ?? "#888";
}
function sectionName(sections: Section[], id: string) {
  return sections.find((s) => s.id === id)?.name ?? "";
}
