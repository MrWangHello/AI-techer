"use client";

import Cat3D, { type PetAction } from "@/components/Cat3D";
import PetStatus from "@/components/PetStatus";
import VoiceHintBar from "@/components/VoiceHintBar";
import Card from "@/components/ui/Card";
import { TAB_VOICE_HINTS } from "@/lib/voice-hints";
import { ACHIEVEMENTS, type PetData } from "@/lib/pet-data";

export default function PetTab({
  pet,
  mood,
  action,
  speaking,
  showAchievements,
  voiceSpeed,
  onTapCat,
  onActionEnd,
  onFeed,
  onPlay,
  onBathe,
  onSleep,
  onToggleAchievements,
}: {
  pet: PetData;
  mood: "happy" | "sad" | "surprised" | "neutral" | "thinking";
  action: PetAction;
  speaking: boolean;
  showAchievements: boolean;
  voiceSpeed: number;
  onTapCat: () => void;
  onActionEnd: () => void;
  onFeed: () => void;
  onPlay: () => void;
  onBathe: () => void;
  onSleep: () => void;
  onToggleAchievements: () => void;
}) {
  const actions = [
    { label: "喂食", icon: "🍖", color: "bg-orange-100", onClick: onFeed },
    { label: "玩耍", icon: "🎮", color: "bg-blue-100", onClick: onPlay },
    { label: "洗澡", icon: "🛁", color: "bg-cyan-100", onClick: onBathe },
    { label: "睡觉", icon: "💤", color: "bg-purple-100", onClick: onSleep },
  ];

  return (
    <div className="space-y-4 animate-slideUp">
      <div className="rounded-2xl shadow-sm border border-pink-100/40 overflow-hidden">
        <div className="aspect-[4/5] max-h-[500px] relative">
          <Cat3D mood={mood} action={action} speaking={speaking} onTap={onTapCat} onActionEnd={onActionEnd} />
        </div>
      </div>

      <PetStatus pet={pet} />

      <VoiceHintBar text={TAB_VOICE_HINTS.pet} className="mb-1" voiceSpeed={voiceSpeed} />
      <div className="flex justify-center gap-4">
        {actions.map((action) => (
          <button key={action.label} type="button" onClick={action.onClick} className="flex flex-col items-center gap-1">
            <div
              className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center text-2xl hover:brightness-95 active:scale-90 transition-all`}
            >
              {action.icon}
            </div>
            <span className="text-sm text-gray-600">{action.label}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-700">
            成就 ({pet.achievements.length}/{ACHIEVEMENTS.length})
          </h3>
          <button type="button" onClick={onToggleAchievements} className="text-sm text-pink-600 min-h-11 px-2">
            {showAchievements ? "收起" : "查看全部"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(showAchievements ? ACHIEVEMENTS : ACHIEVEMENTS.slice(0, 6)).map((ach) => {
            const unlocked = pet.achievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm ${
                  unlocked ? "bg-yellow-50 text-yellow-800" : "bg-gray-100 text-gray-500"
                }`}
                title={ach.desc}
              >
                <span>{ach.icon}</span>
                <span>{ach.name}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
