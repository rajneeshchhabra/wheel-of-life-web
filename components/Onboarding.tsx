"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { defaultSections } from "@/lib/catalog";
import type { Section } from "@/lib/types";

type Step = "privacy" | "name" | "purpose" | "weights";

/** Privacy promise first, then a short setup: name → purpose → how much each area matters. */
export default function Onboarding() {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState<Step>(state.privacySeen ? "name" : "privacy");
  const [name, setName] = useState(state.profile.name);
  const [purpose, setPurpose] = useState(state.profile.purpose);
  const [sections] = useState<Section[]>(() => (state.sections.length ? state.sections : defaultSections()));
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, s.weight])),
  );

  const finish = () => {
    if (!state.sections.length) {
      // seed sections into state first so completeSetup can apply weights by id
      dispatch({ type: "hydrate", state: { ...state, sections } });
    }
    dispatch({ type: "completeSetup", name: name.trim() || "Friend", purpose: purpose.trim(), weights });
  };

  return (
    <div className="fixed inset-0 z-40 bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {step === "privacy" && (
          <Card>
            <div className="text-5xl text-center">🔒</div>
            <h1 className="text-2xl font-black text-center mt-4">Here&apos;s the deal</h1>
            <p className="text-center text-text2 mt-2">I&apos;m going to ask to know you — not to sell or use your info.</p>
            <div className="mt-6 space-y-3 rounded-xl bg-white/[0.04] p-4">
              <Promise title="Your data stays in this browser" text="Nothing leaves your device unless you choose to share it." />
              <Promise title="No selling, no training, no tracking" text="This app gets smarter for you — not smarter about you for anyone else." />
              <Promise title="You can erase everything anytime" text="One click in Settings. Gone, completely." />
            </div>
            <Primary
              onClick={() => {
                dispatch({ type: "privacySeen" });
                setStep("name");
              }}
            >
              I understand, let&apos;s go
            </Primary>
          </Card>
        )}

        {step === "name" && (
          <Card>
            <h1 className="text-2xl font-black">What should we call you?</h1>
            <p className="text-text2 mt-1">Your real name, or something that feels like you.</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep("purpose")}
              placeholder="Your name"
              className="mt-5 w-full bg-panel2 text-lg rounded-lg px-4 py-3 border border-white/10 focus:outline-none focus:border-indigo-400/60"
            />
            <Primary onClick={() => setStep("purpose")} disabled={!name.trim()}>
              Continue
            </Primary>
          </Card>
        )}

        {step === "purpose" && (
          <Card>
            <h1 className="text-2xl font-black">What is it all for, {name.trim() || "friend"}?</h1>
            <p className="text-text2 mt-1">
              One line. Your north star — everything on the wheel should serve this. You can change it later.
            </p>
            <textarea
              autoFocus
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              placeholder="e.g. To be strong, free, and present for the people I love."
              className="mt-5 w-full bg-panel2 text-base rounded-lg px-4 py-3 border border-white/10 focus:outline-none focus:border-indigo-400/60"
            />
            <div className="flex gap-2 mt-4">
              <Secondary onClick={() => setStep("name")}>Back</Secondary>
              <Primary onClick={() => setStep("weights")}>Continue</Primary>
            </div>
          </Card>
        )}

        {step === "weights" && (
          <Card>
            <h1 className="text-2xl font-black">How much does each area matter to you?</h1>
            <p className="text-text2 mt-1">The wheel gives more room to what matters more. Essentials can be made smaller, never removed.</p>
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
            <div className="flex gap-2 mt-4">
              <Secondary onClick={() => setStep("purpose")}>Back</Secondary>
              <Primary onClick={finish}>Show me my wheel</Primary>
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
function Promise({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-green-400 font-bold">✓</span>
      <div>
        <p className="text-[13.5px] font-semibold text-text1">{title}</p>
        <p className="text-xs text-text2">{text}</p>
      </div>
    </div>
  );
}
function Primary({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-6 w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-semibold rounded-lg px-4 py-3"
    >
      {children}
    </button>
  );
}
function Secondary({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-6 text-text2 hover:text-text1 font-semibold rounded-lg px-4 py-3 border border-white/10">
      {children}
    </button>
  );
}
