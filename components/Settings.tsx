"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { isEssential } from "@/lib/catalog";
import { Modal } from "./Rails";

export default function Settings({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [confirmErase, setConfirmErase] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        <Block title="Purpose" note="Your north star — shown above the wheel.">
          <input
            value={state.profile.purpose}
            onChange={(e) => dispatch({ type: "setPurpose", purpose: e.target.value })}
            placeholder="What is it all for?"
            className="w-full bg-panel2 text-sm rounded-md px-3 py-2 border border-white/10 focus:outline-none focus:border-indigo-400/60"
          />
        </Block>

        <Block
          title="Life areas"
          note="Some areas (Fitness, Financial) can't be removed — they're essential. But they can be made smaller if you need less focus there."
        >
          <div className="space-y-2">
            {state.sections.map((s) => {
              const locked = isEssential(s.name);
              return (
                <div key={s.id} className={`rounded-lg border border-white/8 bg-white/[0.02] p-3 ${s.enabled ? "" : "opacity-50"}`}>
                  <div className="flex items-center gap-3">
                    {locked ? (
                      <span className="text-amber-400 text-sm" title="Essential — can't be removed">
                        🔒
                      </span>
                    ) : (
                      <button
                        onClick={() => dispatch({ type: "toggleSection", id: s.id })}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${
                          s.enabled ? "border-green-400 bg-green-400/20 text-green-300" : "border-white/20"
                        }`}
                        title={s.enabled ? "On the wheel" : "Off the wheel"}
                      >
                        {s.enabled ? "✓" : ""}
                      </button>
                    )}
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.colorHex }} />
                    <span className="text-sm font-semibold text-text1 flex-1">{s.name}</span>
                    <span className="text-xs text-text3">importance {s.weight}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={s.weight}
                    onChange={(e) => dispatch({ type: "setSectionWeight", id: s.id, weight: Number(e.target.value) })}
                    className="w-full mt-2 accent-indigo-400"
                  />
                </div>
              );
            })}
          </div>
        </Block>

        <Block title="Data" note="Everything lives in this browser only. Nothing is sent anywhere.">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                dispatch({ type: "populateDemo" });
                setDone("Populated — every area at 85. This is what balanced looks like.");
              }}
              className="text-sm bg-white/8 hover:bg-white/12 rounded-md px-3 py-1.5 border border-white/10"
            >
              Populate with balanced demo data
            </button>
            {!confirmErase ? (
              <button
                onClick={() => setConfirmErase(true)}
                className="text-sm text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-md px-3 py-1.5 border border-red-400/20"
              >
                Start fresh — erase all data…
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text2">Huh… ok… well… sure?</span>
                <button
                  onClick={() => {
                    dispatch({ type: "eraseAll" });
                    setConfirmErase(false);
                    setDone("Erased. Areas reset to zero; everything else is gone.");
                  }}
                  className="text-red-200 bg-red-500/80 hover:bg-red-500 rounded-md px-3 py-1.5 font-semibold"
                >
                  Yes, erase
                </button>
                <button onClick={() => setConfirmErase(false)} className="text-text2 px-2">
                  Cancel
                </button>
              </div>
            )}
          </div>
          {done && <p className="text-xs text-text2 mt-2">{done}</p>}
        </Block>
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={onClose} className="text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-md px-4 py-1.5">
          Done
        </button>
      </div>
    </Modal>
  );
}

function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] tracking-[0.2em] font-bold text-text3 mb-2">{title.toUpperCase()}</h4>
      {children}
      {note && <p className="text-[11px] text-text3 mt-2">{note}</p>}
    </div>
  );
}
