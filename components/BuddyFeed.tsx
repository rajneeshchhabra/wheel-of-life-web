"use client";
import { useStore } from "@/lib/store";

export default function BuddyFeed() {
  const { state } = useStore();
  const buddies = new Set(state.buddies.filter(b => b.status === "active").map(b => b.id));
  const activities = state.activities.filter(a => buddies.has(a.userId));
  return <section className="buddy-panel"><p className="eyebrow">YOUR BUDDIES</p>
    {activities.length ? activities.map(a => <div key={a.id} className="mt-4"><p>{a.title}</p><p className="supporting">{a.description}</p></div>) : <p className="supporting">No connected buddy activity. Invitations and reactions aren’t available yet.</p>}
  </section>;
}
