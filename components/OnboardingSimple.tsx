"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { defaultSections } from "@/lib/catalog";
import type { Section } from "@/lib/types";

type Step = "name" | "northStar" | "weights" | "buddies";

const NORTH_STAR_OPTIONS = [
  "Build a strong, healthy life",
  "Create real wealth and freedom",
  "Deep, meaningful connections",
  "Be my best self",
  "Make a positive impact",
];

export default function OnboardingSimple() {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState(state.profile.name);
  const [northStar, setNorthStar] = useState(state.profile.northStar || "");
  const [customNorthStar, setCustomNorthStar] = useState(false);
  const [sections] = useState<Section[]>(() =>
    state.sections.length ? state.sections : defaultSections()
  );
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, s.weight]))
  );
  const [buddies, setBuddies] = useState<string[]>([]);
  const [buddyEmail, setBuddyEmail] = useState("");

  const finish = () => {
    if (!state.sections.length) {
      dispatch({ type: "hydrate", state: { ...state, sections } });
    }
    dispatch({
      type: "completeSetup",
      name: name.trim() || "Friend",
      purpose: northStar.trim(),
      weights,
      northStar: northStar.trim(),
    });
  };

  const addBuddy = () => {
    if (buddyEmail.trim()) {
      setBuddies([...buddies, buddyEmail]);
      setBuddyEmail("");
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* STEP 1: NAME + NORTH STAR (COMBINED) */}
        {step === "name" && (
          <Card>
            <h1 className="text-2xl font-black">Hi! I'm...</h1>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-4 w-full bg-panel2 text-lg rounded-lg px-4 py-2 border border-white/10"
            />

            <p className="text-sm text-text2 mt-6 mb-3">My one big thing:</p>

            {!customNorthStar ? (
              <div className="space-y-2">
                {NORTH_STAR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setNorthStar(option);
                      setStep("weights");
                    }}
                    className="w-full text-left p-3 rounded-lg border border-white/10 hover:border-indigo-400/60 text-sm text-text2 hover:bg-panel2 transition"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <textarea
                  autoFocus
                  value={northStar}
                  onChange={(e) => setNorthStar(e.target.value)}
                  placeholder="What's your north star?"
                  rows={2}
                  className="w-full bg-panel2 text-sm rounded-lg px-4 py-2 border border-white/10"
                />
                <button
                  onClick={() => setStep("weights")}
                  disabled={!northStar.trim()}
                  className="mt-4 w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-semibold rounded-lg px-4 py-2"
                >
                  Continue
                </button>
              </>
            )}

            {!customNorthStar && (
              <button
                onClick={() => setCustomNorthStar(true)}
                className="mt-4 w-full text-indigo-400 hover:text-indigo-300 text-sm font-semibold"
              >
                Or write your own...
              </button>
            )}

            {customNorthStar && (
              <button
                onClick={() => {
                  setCustomNorthStar(false);
                  setNorthStar("");
                }}
                className="mt-2 text-text3 text-xs underline"
              >
                Pick from options
              </button>
            )}
          </Card>
        )}

        {/* STEP 2: WEIGHTS */}
        {step === "weights" && (
          <Card>
            <h1 className="text-2xl font-black">What matters most?</h1>
            <p className="text-text2 mt-1 text-sm">(Drag to size)</p>

            <div className="mt-5 space-y-3">
              {sections.map((s) => (
                <div key={s.id}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.colorHex }} />
                    <span className="font-semibold flex-1">{s.name}</span>
                    <span className="text-text3 text-xs">{weights[s.id]}/5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={weights[s.id]}
                    onChange={(e) => setWeights({ ...weights, [s.id]: Number(e.target.value) })}
                    className="w-full accent-indigo-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <Secondary onClick={() => setStep("name")}>Back</Secondary>
              <Primary onClick={() => setStep("buddies")}>Continue</Primary>
            </div>
          </Card>
        )}

        {/* STEP 3: BUDDIES */}
        {step === "buddies" && (
          <Card>
            <h1 className="text-2xl font-black">Who's got your back?</h1>
            <p className="text-text2 mt-1 text-sm">Pick 1-3 buddies for accountability</p>

            {buddies.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {buddies.map((buddy, idx) => (
                  <div
                    key={idx}
                    className="bg-panel2 px-3 py-1 rounded-full text-sm text-text1 flex items-center gap-2"
                  >
                    {buddy}
                    <button
                      onClick={() => setBuddies(buddies.filter((_, i) => i !== idx))}
                      className="text-text3 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <input
                value={buddyEmail}
                onChange={(e) => setBuddyEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBuddy()}
                placeholder="Buddy email"
                type="email"
                className="flex-1 bg-panel2 text-sm rounded-lg px-3 py-2 border border-white/10"
              />
              <button
                onClick={addBuddy}
                disabled={!buddyEmail.trim()}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-semibold rounded-lg px-4 py-2"
              >
                Add
              </button>
            </div>

            <p className="text-text3 text-xs mt-2">You can add more later, or skip for now</p>

            <div className="flex gap-2 mt-6">
              <Secondary onClick={() => setStep("weights")}>Back</Secondary>
              <Primary onClick={finish}>Let's go</Primary>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-panel rounded-2xl border border-white/10 p-8 shadow-2xl">{children}</div>;
}

function Primary({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-semibold rounded-lg px-4 py-2"
    >
      {children}
    </button>
  );
}

function Secondary({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 text-text2 hover:text-text1 font-semibold rounded-lg px-4 py-2 border border-white/10">
      {children}
    </button>
  );
}
