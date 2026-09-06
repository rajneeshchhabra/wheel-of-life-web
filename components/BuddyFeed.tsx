"use client";

import { useState } from "react";
import type { Activity, ReactionType } from "@/lib/types";

const REACTIONS: { type: ReactionType; emoji: string; label: string; category: "positive" | "supportive" | "playful" }[] = [
  { type: "wellDone", emoji: "💪", label: "Well done!", category: "positive" },
  { type: "onFire", emoji: "🔥", label: "You're on fire", category: "positive" },
  { type: "weveGotYou", emoji: "🙌", label: "We've got you", category: "positive" },
  { type: "yes", emoji: "🎉", label: "Yes!", category: "positive" },
  { type: "king", emoji: "👑", label: "King/Queen", category: "positive" },
  { type: "whatHappened", emoji: "🤔", label: "What happened?", category: "supportive" },
  { type: "noWorries", emoji: "🙏", label: "No worries", category: "supportive" },
  { type: "gotThis", emoji: "💙", label: "You got this", category: "supportive" },
  { type: "needHelp", emoji: "🆘", label: "Need help?", category: "supportive" },
  { type: "together", emoji: "🤝", label: "Together?", category: "supportive" },
  { type: "prove", emoji: "📹", label: "Prove it", category: "playful" },
  { type: "ahead", emoji: "🏆", label: "You're ahead", category: "playful" },
  { type: "sameLol", emoji: "😂", label: "LOL same", category: "playful" },
  { type: "dontTell", emoji: "🤐", label: "Don't tell", category: "playful" },
  { type: "notBad", emoji: "👍", label: "Not bad", category: "playful" },
];

export default function BuddyFeed() {

  // Mock activities (in real app, would come from server)
  const mockActivities: Activity[] = [
    {
      id: "1",
      userId: "sarah",
      type: "habitCompleted",
      title: "Sarah just ran 5K! 🏃",
      description: "Pace: 5:30/km | Time: 28:30",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      relatedIds: { habitId: "running" },
    },
    {
      id: "2",
      userId: "marcus",
      type: "streakMilestone",
      title: "Marcus hit 14-day meditation streak! 🔥",
      description: "2 more days to habit formed",
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      relatedIds: { habitId: "meditation" },
    },
  ];

  const getTimeAgo = (timestamp: string) => {
    const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleReaction = (activityId: string, reactionType: ReactionType) => {
    console.log("Reaction:", reactionType, "to activity:", activityId);
    // In real app, would send to server and add to reactions
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-text3 uppercase tracking-wider">Your Buddies</h2>

      {mockActivities.length === 0 ? (
        <div className="text-center py-6 text-text3">
          <p>No buddy activity yet. Invite friends to get started!</p>
        </div>
      ) : (
        mockActivities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} onReaction={handleReaction} getTimeAgo={getTimeAgo} />
        ))
      )}

      {/* Add Buddy Section */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-xs font-semibold text-text2 mb-3">Add Buddy</h3>
        <input
          type="email"
          placeholder="friend@example.com"
          className="w-full bg-panel2 text-sm rounded-md px-3 py-2 border border-white/10 focus:border-indigo-400/60"
        />
        <button className="mt-2 w-full bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-md px-3 py-1.5">
          Invite
        </button>
      </div>
    </div>
  );
}

function ActivityCard({
  activity,
  onReaction,
  getTimeAgo,
}: {
  activity: Activity;
  onReaction: (activityId: string, type: ReactionType) => void;
  getTimeAgo: (timestamp: string) => string;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const positiveReactions = REACTIONS.filter((r) => r.category === "positive");

  return (
    <div className="bg-panel2 rounded-lg p-3 border border-white/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text1">{activity.title}</p>
          <p className="text-xs text-text3 mt-0.5">{activity.description}</p>
          <p className="text-xs text-text3 mt-1">{getTimeAgo(activity.timestamp)}</p>
        </div>
      </div>

      {/* Quick Reactions */}
      <div className="mt-2 flex gap-1">
        {positiveReactions.slice(0, 3).map((reaction) => (
          <button
            key={reaction.type}
            onClick={() => onReaction(activity.id, reaction.type)}
            title={reaction.label}
            className="text-lg hover:scale-125 transition"
          >
            {reaction.emoji}
          </button>
        ))}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="text-xs text-text3 hover:text-text2 ml-auto"
        >
          {showReactions ? "−" : "+"}
        </button>
      </div>

      {showReactions && (
        <div className="mt-2 p-2 bg-panel rounded-md border border-white/10">
          <div className="grid grid-cols-5 gap-1">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => {
                  onReaction(activity.id, reaction.type);
                  setShowReactions(false);
                }}
                title={reaction.label}
                className="text-lg hover:scale-125 transition p-1"
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
